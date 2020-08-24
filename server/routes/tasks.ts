import express, { Request, Response, NextFunction } from 'express';
import Sequelize from 'sequelize';
import fs from 'fs';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import db from '../index';
import helper from '../helper_functions';

const router = express.Router();
const { Op } = Sequelize;
let cert;
fs.readFile('tjcschedule_pub.pem', function read(err, data) {
    if (err) throw err;
    cert = data;
});
module.exports = router;

router.get('/tasks', async (req: Request, res: Response, next: NextFunction) => {
    try {
        jwt.verify(req.headers.authorization, cert);
        const searchArray = [];
        if (req.query.userId) searchArray.push({ userId: req.query.userId });
        if (req.query.churchId) searchArray.push({ churchId: req.query.churchId });
        if (req.query.roleId) searchArray.push({ roleId: req.query.roleId });

        const searchParams = {
            [Op.and]: searchArray,
            date: { [Op.gt]: new Date() },
        };
        const tasks = await db.Task.findAll({
            where: searchParams,
            attributes: [['id', 'taskId'], 'userId', 'roleId', 'date', 'createdAt'],
            include: [
                {
                    model: db.Role,
                    as: 'role',
                    attributes: ['name'],
                },
                {
                    model: db.Church,
                    as: 'church',
                    attributes: ['name', ['id', 'churchId']],
                },
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['firstName', 'lastName'],
                },
            ],
            order: [['date', 'ASC']],
        });
        if (tasks) {
            res.status(200).json(tasks);
        } else {
            res.status(404).send({ message: 'Not found' });
        }
    } catch (err) {
        if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
            res.status(401).send({ message: 'Unauthorized' });
        } else {
            res.status(503).send({ message: 'Server error, try again later' });
        }
        next(err);
    }
});

router.get('/tasks/:taskId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        jwt.verify(req.headers.authorization, cert);
        const task = await db.Task.findOne({
            where: { taskId: req.params.taskId },
            attributes: ['id', 'date', 'churchId', 'userId', 'roleId'],
        });
        if (task) res.status(200).json(task);
        else res.status(404).send({ message: 'Task not found' });
    } catch (err) {
        if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
            res.status(401).send({ message: 'Unauthorized' });
        } else {
            res.status(503).send({ message: 'Server error, try again later' });
        }
        next(err);
    }
});

router.post('/tasks', async (req: Request, res: Response, next: NextFunction) => {
    try {
        jwt.verify(req.headers.authorization, cert);
        const now = new Date();
        const userId = jwt
            .decode(req.headers.authorization, { json: true })
            .sub.split('|')[1];
        const userData = await db.User.findOne({
            where: { id: userId },
            include: [
                {
                    model: db.Church,
                    as: 'church',
                    attributes: ['id', 'name', 'address', 'timeZone'],
                },
            ],
        });
        const date = helper.setDate(
            req.body.date,
            req.body.time,
            userData.church.timeZone,
        );
        const task = await db.Task.create({
            date: new Date(date.toString()),
            churchId: userData.church.id,
            roleId: req.body.roleId,
            userId: parseInt(userId, 10),
        });
        const millisTillDate = new Date(date.toString()).getTime() - now.getTime();
        setTimeout(function () {
            task.update({
                status: 'archived',
            });
        }, millisTillDate);
        res.status(201).send(task);
    } catch (err) {
        if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
            res.status(401).send({ message: 'Unauthorized' });
        } else {
            res.status(503).send({ message: 'Server error, try again later' });
        }
        next(err);
    }
});

router.delete('/tasks/:taskId', async (req: Request, res: Response, next) => {
    try {
        jwt.verify(req.headers.authorization, cert);
        const task = await db.Task.findOne({
            where: { id: req.params.taskId },
        });
        if (task) {
            await task.destroy().then(function () {
                res.status(200).send({ message: 'Task deleted' });
            });
        } else {
            res.status(404).send({ message: 'Task not found' });
        }
    } catch (err) {
        if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
            res.status(401).send({ message: 'Unauthorized' });
        } else {
            res.status(503).send({ message: 'Server error, try again later' });
        }
        next(err);
    }
});

router.patch(
    '/tasks/switchTask/:targetTaskId/switchWith/:switchTaskId',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            jwt.verify(req.headers.authorization, cert);
            const targetTask = await db.Task.findOne({
                where: { id: req.params.targetTaskId },
                attributes: ['id', 'date', 'churchId', 'userId', 'roleId'],
            });

            const switchTask = await db.Task.findOne({
                where: { id: req.params.switchTaskId },
                attributes: ['id', 'date', 'churchId', 'userId', 'roleId'],
            });
            if (!targetTask || !switchTask) {
                return res.status(404).send({ message: 'Not found' });
            }
            // if (targetTask.ChurchId === switchTask.ChurchId) {
            const targetTaskId = targetTask.userId;
            const switchTaskId = switchTask.userId;
            targetTask.update({
                id: targetTask.id,
                userId: switchTaskId,
            });

            switchTask.update({
                id: switchTask.id,
                userId: targetTaskId,
            });
            res.status(200).send({ message: 'Task switch successful' });
            // }
        } catch (err) {
            if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
                res.status(401).send({ message: 'Unauthorized' });
            } else {
                res.status(503).send({ message: 'Server error, try again later' });
            }
            next(err);
        }
    },
);

router.patch(
    '/tasks/replaceTask/:taskId/replacedBy/:userId',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            jwt.verify(req.headers.authorization, cert);
            const task = await db.Task.findOne({
                where: {
                    id: req.params.taskId.toString(),
                },
                attributes: ['id', 'userId'],
            });

            const replacedByUser = await db.User.findOne({
                where: { id: req.params.userId.toString() },
                attributes: ['id', 'churchId'],
            });

            const belongsToUser = await db.User.findOne({
                where: { id: task.userId },
                attributes: ['id', 'churchId'],
            });
            if (!task || !replacedByUser || !belongsToUser) {
                return res.status(404).send({ message: 'Not found' });
            }
            // if (replacedByUser.ChurchId === belongsToUser.ChurchId) {
            await task.update({
                id: task.id,
                userId: replacedByUser.id,
            });
            res.status(200).send({ message: 'Task replacement successful.' });
            // }
        } catch (err) {
            if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
                res.status(401).send({ message: 'Unauthorized' });
            } else {
                res.status(503).send({ message: 'Server error, try again later' });
            }
            next(err);
        }
    },
);
