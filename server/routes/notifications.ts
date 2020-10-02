import express, { Request, Response, NextFunction } from 'express';
import { UserInstance } from 'shared/SequelizeTypings/models';
import db from '../index';
import {
    makeMyNotificationMessage,
    sendPushNotification,
    certify,
    determineLoginId,
} from '../utilities/helperFunctions';

const router = express.Router();

module.exports = router;

router.get('/notifications/:userId', certify, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const swapNotifications = await db.Notification.findAll({
            where: { userId },
            attributes: ['id', 'userId', 'message', 'createdAt', 'requestId'],
            include: [
                {
                    model: db.Request,
                    as: 'request',
                    attributes: ['requesteeUserId', 'type', 'accepted', 'approved', 'createdAt', 'taskId'],
                },
                {
                    model: db.Task,
                    as: 'task',
                    attributes: ['date', 'status', 'churchId', 'userId', 'roleId'],
                },
            ],
        });
        if (swapNotifications.length > 0) return res.status(200).json(swapNotifications);
        return res.status(404).send({ message: 'Not found' });
    } catch (err) {
        next(err);
        return res.status(503).send({ message: 'Server error, try again later' });
    }
});

router.post('/notifications', certify, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInId: number = determineLoginId(req.headers.authorization);
        const { requestId, notification } = req.body;
        console.log(loggedInId, requestId, notification);
        const request = await db.Request.findOne({
            where: { id: requestId },
            attributes: ['id', 'requesteeUserId', 'type', 'accepted', 'approved'],
            include: [
                {
                    model: db.Task,
                    as: 'task',
                    attributes: ['id', 'userId'],
                },
            ],
        });
        const { requesteeUserId, task, type: swapRequestType } = request;

        if (!notification) return res.status(400).send({ message: 'Invalid notification type.' });
        if (!request) return res.status(404).send({ message: 'Swap request not found' });

        // whoami
        const {
            firstName: myFirstName,
            churchId: myChurchId,
            id: myUserId,
            expoPushToken: myPushToken,
        } = await db.User.findOne({
            where: { id: task.userId },
            attributes: ['id', 'firstName', 'churchId', 'expoPushToken'],
        });

        // whoareyou
        const { firstName: theirFirstName } = await db.User.findOne({
            where: { id: requesteeUserId },
            attributes: ['id', 'firstName', 'expoPushToken'],
        });

        const receivers: UserInstance[] =
            notification === 'created' && swapRequestType === 'requestOne' && requesteeUserId
                ? [
                      await db.User.findOne({
                          where: { id: requesteeUserId },
                          attributes: ['id', 'firstName', 'expoPushToken'],
                      }),
                  ]
                : await db.User.findAll({
                      where: { churchId: myChurchId },
                      attributes: ['id', 'firstName', 'expoPushToken'],
                  });

        // creates notification for them
        if (notification === 'created') {
            const theirNotificationMessage =
                swapRequestType === 'requestOne'
                    ? `${myFirstName} wants to switch with you`
                    : `${myFirstName} requested to switch with someone. An open request has been sent out.`;
            receivers.map(async ({ id: theirId, expoPushToken }) => {
                if (theirId !== loggedInId) {
                    await db.Notification.create({
                        userId: theirId,
                        message: theirNotificationMessage,
                        requestId,
                    });
                    sendPushNotification(theirId, expoPushToken, 'Request Notification', theirNotificationMessage);
                }
            });
        }
        // is made if requesteeUser
        const myNotificationMessage = makeMyNotificationMessage(notification, swapRequestType, theirFirstName);
        // creates notification for me
        await db.Notification.create({
            userId: myUserId,
            message: myNotificationMessage,
            requestId,
        });
        sendPushNotification(myUserId, myPushToken, 'Request Notification', myNotificationMessage);
        return res.status(201).send({ message: 'Notifications created' });
    } catch (err) {
        next(err);
        return res.status(503).send({ message: 'Server error, try again later' });
    }
});

router.patch('/notifications/:notificationId', certify, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notification = await db.Notification.findOne({
            where: { id: req.params.notificationId },
            attributes: ['id', 'userId', 'createdAt', 'isRead', 'updatedAt', 'requestId'],
        });
        if (!notification) return res.status(404).send({ message: 'Notification not found' });
        const data = notification.update({ id: notification.id, isRead: true });
        return res.status(200).json(data);
    } catch (err) {
        next(err);
        return res.status(503).send({ message: 'Server error, try again later' });
    }
});

router.patch('/notifications/read-all/:userId', certify, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notifications = await db.Notification.findAll({
            where: { userId: req.params.userId },
            attributes: ['id', 'userId', 'createdAt', 'isRead', 'updatedAt', 'requestId'],
        });
        if (!notifications) return res.status(404).send({ message: 'Notifications not found' });
        const data = notifications.map((notification) => notification.update({ isRead: true }));
        return res.status(200).json(data);
    } catch (err) {
        next(err);
        return res.status(503).send({ message: 'Server error, try again later' });
    }
});

router.delete('/notifications/:notificationId', certify, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notification = await db.Notification.findOne({
            where: { id: req.params.notificationId },
            attributes: ['id', 'userId', 'createdAt', 'updatedAt', 'requestId'],
        });
        if (!notification) return res.status(404).send({ message: 'Notification not found' });
        const data = await notification.destroy();
        return res.status(200).json(data);
    } catch (err) {
        next(err);
        return res.status(503).send({ message: 'Server error, try again later' });
    }
});