import * as Sequelize from 'sequelize';

export interface SwapNotificationAttributes {
    id?: number;
    userId: number;
    message: string;
    RequestId?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SwapNotificationInstance
    extends Sequelize.Instance<SwapNotificationAttributes>,
        SwapNotificationAttributes {}