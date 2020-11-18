import * as Sequelize from 'sequelize';
import { SequelizeAttributes } from 'shared/SequelizeTypings/typings/SequelizeAttributes';
import {
  ChurchInstance,
  ChurchAttributes,
} from 'shared/SequelizeTypings/models/ChurchModel';

const ChurchFactory = (
  sequelize: Sequelize.Sequelize,
  DataTypes: Sequelize.DataTypes,
): Sequelize.Model<ChurchInstance, ChurchAttributes> => {
  const attributes: SequelizeAttributes<ChurchAttributes> = {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    name: { type: DataTypes.STRING },
    address: { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT },
    timezone: { type: DataTypes.STRING },
  };

  const Church = sequelize.define<ChurchInstance, ChurchAttributes>('Church', attributes);

  Church.associate = (models) => {
    Church.hasMany(models.User, { foreignKey: 'churchId' });
    Church.hasMany(models.Role, { foreignKey: 'roleId' });
  };

  return Church;
};

export default ChurchFactory;
