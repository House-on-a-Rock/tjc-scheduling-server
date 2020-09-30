import nodemailer from 'nodemailer';
import crypto from 'crypto';
import jwt, { Algorithm } from 'jsonwebtoken';
import fs from 'fs';
import { DateTime } from 'luxon';
import fetch from 'node-fetch';
import { UserInstance } from 'shared/SequelizeTypings/models';
import db from './index';

const privateKey = fs.readFileSync('tjcschedule.pem');

const funcs = {
    sendGenericEmail(username, link) {
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
            transporter.sendMail(mailOptions, function (err) {
                if (err) {
                    console.log(err);
                    return false;
                }
                return true;
            });
        } catch (err) {
            console.log(err);
        }
    },

    sendVerEmail(username, headers, token, api) {
        try {
            console.log('Sending email..');
            let message;
            if (api === 'confirmation') {
                message = `A verification email has been sent to ${username}.`;
            } else {
                message = `A password recovery email has been sent to ${username}.`;
            }
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
                subject: 'Account Verification Token',
                text: `Hello,\n\n Please verify your account by clicking the link: \nhttp://${headers.host}/api/authentication/${api}?token=${token}`,
            };
            transporter.sendMail(mailOptions, function (err) {
                return err ? console.log(err.message) : console.log('success');
            });
            return [message, 201];
        } catch (err) {
            console.log(err);
            return ['error', 401];
        }
    },

    addMinutes(date: Date, minutes) {
        return new Date(date.getTime() + minutes * 60000);
    },

    createToken(tokenType, userId, expiresInMinutes) {
        console.log('Creating token');
        const token = jwt.sign(
            {
                iss: process.env.AUDIENCE,
                sub: `tjc-scheduling|${userId}`,
                exp: Math.floor(Date.now() / 1000) + expiresInMinutes * 60,
                type: tokenType,
            },
            {
                key: privateKey,
                passphrase: process.env.PRIVATEKEY_PASS,
            },
            { algorithm: process.env.JWT_ALGORITHM as Algorithm },
        );

        return token;
    },
    creatResetToken(userId, expiresInMinutes, secret) {
        console.log('Creating token');
        const token = jwt.sign(
            {
                iss: process.env.AUDIENCE,
                sub: `tjc-scheduling|${userId}`,
                exp: Math.floor(Date.now() / 1000) + expiresInMinutes * 60,
            },
            secret,
        );

        return token;
    },
    validateEmail(email: string) {
        if (/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            return true;
        }
        return false;
    },
    setDate(date: string, time: string, timeZone: string) {
        return DateTime.fromISO(`${date}T${time}`, { zone: timeZone });
    },
    async sendPushNotification(userId: number, userPushToken: string, title: string, body: string) {
        const user = await db.Notification.findAll({
            where: { id: userId, isRead: false },
            attributes: ['isRead'],
        });
        const badgeNumber = user.length + 1;
        fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: userPushToken,
                data: {
                    extraData: 'tsm sucks',
                },
                title: title,
                body: body,
                badge: badgeNumber,
            }),
        });
    },
    hashPassword(password: string, salt: string) {
        return crypto.createHash(process.env.SECRET_HASH).update(password).update(salt).digest('hex');
    },
    makeMyNotification(notification: string, type: string, firstName: string) {
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
    },
    async makeTheirNotifications(type: string, name: string, id: number): Promise<[string, UserInstance[]]> {
        const message =
            type === 'requestOne'
                ? `${name} wants to switch with you`
                : `${name} requested to switch with someone. An open request has been sent out.`;
        const receivers: UserInstance[] =
            type === 'requestOne'
                ? [
                      await db.User.findOne({
                          where: { id: id },
                          attributes: ['id', 'firstName', 'expoPushToken'],
                      }),
                  ]
                : await db.User.findAll({
                      where: { churchId: id },
                      attributes: ['id', 'firstName', 'expoPushToken'],
                  });
        return [message, receivers];
    },
    abstractLoginId(auth, cert) {
        jwt.verify(auth, cert);
        const decodedToken = jwt.decode(auth, { json: true });
        return parseInt(decodedToken.sub.split('|')[1], 10);
    },
};
export default funcs;
