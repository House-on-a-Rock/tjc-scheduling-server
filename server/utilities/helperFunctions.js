/* eslint-disable max-lines */
import crypto from 'crypto';
import fs from 'fs';

import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { DateTime } from 'luxon';
import nodemailer from 'nodemailer';

import db from '../index';

const privateKey = fs.readFileSync('tjcschedule.pem');
let cert;
fs.readFile('tjcschedule_pub.pem', (err, data) => {
  if (err) throw err;
  cert = data;
});

export function certify(req, res, next) {
  try {
    const { authorization = '' } = req.headers;
    jwt.verify(authorization, cert);
    next();
  } catch (err) {
    next(err);
    const [message, status] =
      err instanceof TokenExpiredError || err instanceof JsonWebTokenError
        ? ['Unauthorized', 401]
        : ['Server error, try again later', 503];
    res.send({ message }).status(status);
  }
}

export function sendGenericEmail(username, link) {
  try {
    console.log('Sending email..');
    const transporter = nodemailer.createTransport({
      service: 'Sendgrid',
      auth: {
        user: process.env.VER_EMAIL,
        pass: process.env.VER_PASS,
      },
    });
    // send confirmation email
    const mailOptions = {
      from: 'alraneus@gmail.com',
      to: username,
      subject: 'Password Reset',
      text: `Hello,\n\n Please reset your password to your account by clicking the link: \n${link}`,
    };
    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.log(err);
        return false;
      }
      return true;
    });
  } catch (err) {
    console.error(err);
  }
}

export function sendVerEmail(
  username,
  { hostname }, // https://github.com/getsentry/raven-node/issues/96
  token,
  api,
) {
  try {
    console.log('Sending email..');
    const message =
      api === 'confirmation'
        ? `A verification email has been sent to ${username}.`
        : `A password recovery email has been sent to ${username}.`;

    const transporter = nodemailer.createTransport({
      service: 'Sendgrid',
      auth: {
        user: process.env.VER_EMAIL,
        pass: process.env.VER_PASS,
      },
    });
    // send confirmation email
    const mailOptions = {
      from: 'shaun.tung@gmail.com',
      to: username,
      subject: 'Account Verification Token',
      text: `Hello,\n\n Please verify your account by clicking the link: \nhttp://${hostname}/api/authentication/${api}?token=${token}`,
    };
    // lets not send emails while developing for now lol
    // transporter.sendMail(mailOptions, function (err) {
    //   return !err ? console.log('success') : console.log(err.message);
    // });
    return [message, 201];
  } catch (err) {
    console.log(err);
    return ['error', 401];
  }
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

export function createUserToken(
  tokenType,
  userId,
  churchId,
  expiresInMinutes,
  isAdmin = false,
  roleIds = [],
) {
  console.log('Creating token');
  let mappedRoleIds = '';
  roleIds.forEach((roleId, id) => {
    if (roleId) {
      if (id === 0) mappedRoleIds += roleId.toString();
      else mappedRoleIds += `|${roleId.toString()}`;
    }
  });
  if (isAdmin) mappedRoleIds = '0';
  const token = jwt.sign(
    {
      iss: process.env.AUDIENCE,
      sub: `tjc-scheduling|${userId}|${churchId}`,
      exp: Math.floor(Date.now() / 1000) + expiresInMinutes * 60 * 60,
      type: tokenType,
      access: mappedRoleIds,
    },
    {
      key: privateKey,
      passphrase: process.env.PRIVATEKEY_PASS ?? '',
    },
    { algorithm: process.env.JWT_ALGORITHM },
  );

  return token;
}
export function createResetToken(userId, expiresInMinutes, secret) {
  console.log('Creating reset token');
  const token = jwt.sign(
    {
      iss: process.env.AUDIENCE,
      sub: `tjc-scheduling|${userId}`,
      exp: Math.floor(Date.now() / 1000) + expiresInMinutes * 60,
    },
    secret,
  );

  return token;
}

export function validateEmail(email) {
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
}

export function setDate(date, time, timeZone) {
  return DateTime.fromISO(`${date}T${time}`, { zone: timeZone });
}

export function hashPassword(password, salt) {
  const hashbrown = process.env.SECRET_HASH ?? '';
  return crypto.createHash(hashbrown).update(password).update(salt).digest('hex');
}
export function makeMyNotificationMessage(notification, type, firstName) {
  switch (notification) {
    case 'accepted':
      return `Your requested has been accepted by ${firstName}`;
    case 'approved':
      return `Your request to switch with ${firstName} has been approved`;
    case 'cancelled':
      return `Your request to switch has been cancelled`;
    case 'created':
      return type === 'requestOne'
        ? `Request sent to ${firstName}`
        : `Request sent to all local church members`;
    default:
      return 'Invalid notification type.';
  }
}

export function determineLoginId(auth = '') {
  const decodedToken = jwt.decode(auth, { json: true });
  return parseInt(decodedToken?.sub.split('|')[1], 10);
}

export function timeToMilliSeconds(time = '') {
  const [hourMin, period] = time.split(' ');
  const [hour, min] = hourMin.split(':');
  const convertedHour = hour === '12' ? 0 : 3600000 * parseInt(hour, 10);
  const convertedMin = 60000 * parseInt(min, 10);
  const convertedPeriod = period === 'AM' ? 0 : 43200000;

  return convertedHour + convertedMin + convertedPeriod;
}

export function isInTime(target, start, end) {
  const targetTime = timeToMilliSeconds(target);
  const startTime = timeToMilliSeconds(start);
  const endTime = timeToMilliSeconds(end);
  return startTime <= targetTime && targetTime <= endTime;
}

export function isTimeBefore(comparing, target) {
  const targetTime = timeToMilliSeconds(target);
  const comparingTime = timeToMilliSeconds(comparing);
  return comparingTime < targetTime;
}

const zeroPaddingDates = (date) => {
  let month = (date.getMonth() + 1).toString();
  let day = date.getDate().toString();

  month = month.length > 1 ? month : `0${month}`;
  day = day.length > 1 ? day : `0${day}`;

  return `${month}/${day}`;
};

function formatDates(weekRange) {
  const r = weekRange.map((week) => {
    const start = zeroPaddingDates(week.start);
    const end = zeroPaddingDates(week.end);

    const returnstring = start === end ? `${start}` : `${start} - ${end}`;
    return { Header: returnstring };
  });
  return r;
}

export function weeksRange(startDate, endDate) {
  const weekArray = [];
  const currentDate = new Date(startDate);
  const currentObj = { start: startDate };

  // eslint-disable-next-line no-unmodified-loop-condition
  while (currentDate <= endDate) {
    if (currentDate.getDay() === 0) {
      currentObj.start = new Date(currentDate);
    } else if (currentDate.getDay() === 6) {
      currentObj.end = new Date(currentDate);
      weekArray.push({ ...currentObj });
    } else if (areDatesEqual(currentDate, endDate)) {
      currentObj.end = new Date(currentDate);
      weekArray.push({ ...currentObj });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return weekArray;
}

export function createColumns(weekRange) {
  return [
    { Header: '' },
    { Header: 'Time' },
    { Header: 'Duty' },
    ...formatDates(weekRange),
  ];
}

function areDatesEqual(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const cellStatus = {
  SYNCED: 'synced',
  MODIFIED: 'modified',
  WARNING: 'warning',
};

export async function populateServiceData(service, scheduleId, weekRange) {
  const { name, day, id } = service;
  const events = await db.Event.findAll({
    where: { serviceId: id },
    order: [['order', 'ASC']],
  }); // returns events in ascending order
  const eventData = await Promise.all(
    events.map(async (event) => {
      const { time, roleId, id: eventId, serviceId } = event;
      const userRoles = await db.UserRole.findAll({
        where: { roleId: roleId },
        attributes: ['userId'],
      });
      const userIds = userRoles.map((userRole) => userRole.userId);
      const tasks = await retrieveTaskData(
        eventId,
        weekRange[0],
        weekRange[weekRange.length - 1],
        userIds,
      );
      return {
        time,
        roleId,
        eventId,
        cells: [{}, {}, ...tasks],
        serviceId,
      };
    }),
  );
  return {
    name,
    day,
    events: eventData,
    serviceId: id,
    scheduleId: parseInt(scheduleId),
  };
}

// maybe can truncate last item of weeksArray if weeksArray.length > tasks.length?

async function retrieveTaskData(eventId, firstWeek, lastWeek, userIds) {
  const tasks = await db.Task.findAll({
    where: { eventId },
    attributes: ['id', 'userId', 'date'],
    order: [['date', 'ASC']],
  });
  const organizedTasks = tasks.map((task) => {
    // checks if userId belongs to list of users with that role.
    const doesRoleMatch = userIds.indexOf(task.userId);
    return {
      taskId: task.id,
      userId: task.userId,
      // if role does not match, cell will receive 'warning' status and will appear red in frontend
      status:
        doesRoleMatch >= 0 || task.userId === null
          ? cellStatus.SYNCED
          : cellStatus.WARNING,
    };
  });
  // adds a spacer cell for when a service does not exist on that date
  if (!containsDate(firstWeek, tasks[0].date))
    organizedTasks.unshift({ taskId: null, userId: null });
  if (!containsDate(lastWeek, tasks[tasks.length - 1].date))
    organizedTasks.push({ taskId: null, userId: null });
  return organizedTasks;
}

function containsDate(range, date) {
  const startDate = new Date(range.start);
  const endDate = new Date(range.end);
  const testDate = removeTimezoneFromDate(date);
  return testDate - startDate >= 0 && endDate - testDate >= 0;
}

// returns the date of every day (eg. monday or tues) within the range
export const recurringDaysOfWeek = (startDate, endDate, dayOfWeeK) => {
  const [start, end] = [
    replaceDashWithSlash(startDate),
    new Date(replaceDashWithSlash(endDate)),
  ];
  const weeks = [];
  const startDayOfWeek = new Date(start).getDay();
  let dayModifier = dayOfWeeK - startDayOfWeek;
  if (dayModifier < 0) dayModifier += 7;
  let current = new Date(start);

  current.setDate(current.getDate() + dayModifier);
  while (current <= end) {
    weeks.push(new Date(current));
    current = new Date(current.setDate(current.getDate() + 7));
  }
  return weeks;
};

export const updateEvents = async (events, t) => {
  await Promise.all(
    events.map(async (item, index) => {
      const { eventId, time, roleId, serviceId } = item;
      const targetEvent = await db.Event.findOne({
        where: { id: eventId },
      });

      if (targetEvent)
        // if event already exists, update to match incoming data
        return targetEvent.update({ time, roleId, order: index }, { transaction: t });
      else {
        // else create new event, and corresponding tasks
        const newEvent = await db.Event.create(
          { time, roleId, serviceId, order: index },
          { transaction: t },
        );
        const parentService = await db.Service.findOne({
          where: { id: serviceId },
        });
        const parentSchedule = await db.Schedule.findOne({
          where: { id: parentService.scheduleId },
        });
        const taskDays = recurringDaysOfWeek(
          parentSchedule.start,
          parentSchedule.end,
          parentService.day,
        );
        taskDays.forEach((date) =>
          db.Task.create({ date, eventId: newEvent.id }, { transaction: t }),
        );
        return newEvent;
      }
    }),
  );
};

export const updateServices = async (services, t) => {
  await Promise.all(
    services.map(async (item, index) => {
      const targetService = await db.Service.findOne({
        where: { id: item.serviceId },
      });
      if (targetService)
        return targetService.update(
          { name: item.name, day: item.day, order: index },
          { transaction: t },
        );
      else {
        return db.Service.create({ ...item, order: index }, { transaction: t });
      }
    }),
  );
};

export const updateTasks = async (tasks, t) => {
  await Promise.all(
    tasks.map(async (item) => {
      const targetTask = await db.Task.findOne({
        where: { id: item.taskId },
      });
      return targetTask.update(
        { userId: item.userId > 0 ? item.userId : null },
        { transaction: t },
      );
    }),
  );
};

export const deleteServices = async (Services, t) => {
  await Promise.all(
    Services.map(async (item) => {
      await db.Service.destroy(
        {
          where: { id: item },
        },
        { transaction: t },
      );
    }),
  );
};

export const deleteEvents = async (events, t) => {
  await Promise.all(
    events.map(async (item) => {
      await db.Event.destroy(
        {
          where: { id: item },
        },
        { transaction: t },
      );
    }),
  );
};

export function removeTimezoneFromDate(date) {
  return new Date(replaceDashWithSlash(date));
}

export function replaceDashWithSlash(str) {
  const regex = /-/gm;
  return str.replace(regex, '/');
}
