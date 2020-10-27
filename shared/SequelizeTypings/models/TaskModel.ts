import * as Sequelize from 'sequelize';
import { CommonSequelizeAttributes } from '.';

type StatusTypes = 'active' | 'changeRequested';

export interface TaskAttributes extends CommonSequelizeAttributes {
    status?: StatusTypes;
    date: Date;
    userRoleId?: number;
    eventId?: number;
}

export interface TaskInstance extends Sequelize.Instance<TaskAttributes>, TaskAttributes {}
