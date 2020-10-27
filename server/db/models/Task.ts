import * as Sequelize from 'sequelize';
import { SequelizeAttributes } from 'shared/SequelizeTypings/typings/SequelizeAttributes';
import { TaskInstance, TaskAttributes } from 'shared/SequelizeTypings/models';

const TaskFactory = (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes,
): Sequelize.Model<TaskInstance, TaskAttributes> => {
    const attributes: SequelizeAttributes<TaskAttributes> = {
        date: { type: DataTypes.DATE },
        status: { type: DataTypes.STRING, defaultValue: 'active' },
    };

    const Task = sequelize.define<TaskInstance, TaskAttributes>('Task', attributes);

    Task.associate = (models) => {
        Task.belongsTo(models.Event, { as: 'event', foreignKey: 'eventId' });
        Task.belongsTo(models.UserRole, { as: 'userRole', foreignKey: 'userRoleId' });
    };
    return Task;
};

export default TaskFactory;
