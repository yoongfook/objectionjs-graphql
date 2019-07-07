import { ApolloServer } from 'apollo-server-micro';
import Knex from 'knex';
import { Model } from 'objection';
import jsonwebtoken from 'jsonwebtoken';
import cookie from 'cookie';
import { makeSchema } from 'nexus';
import { applyMiddleware } from 'graphql-middleware';
import * as types from '../schema';
import { permissions } from '../permissions';
import connection from '../knexfile';
import User from '../models/user';

const knexConnection = Knex(connection[process.env.NODE_ENV]);
Model.knex(knexConnection);

const schema = applyMiddleware(
  makeSchema({
    types,
    outputs: false,
    shouldGenerateArtifacts: false
  }),
  permissions
);

const context = async ({ req }) => {
  let user = null;

  try {
    const { jwt } = cookie.parse(req.headers.cookie);
    if (jwt) {
      const hash = jsonwebtoken.verify(jwt, JWTSECRET);
      user = await User.query().findById(hash.id);
    }
  } catch (error) {
    // console.log('jwt error', error);
    // Token not valid
  }

  return {
    user
  };
};

const server = new ApolloServer({
  introspection: true,
  playground: true,
  schema,
  context
});

export const JWTSECRET = 'JWTSECRET';
export const path = '/api/graphql';
export const jwtSign = ({ id, email }) => jsonwebtoken.sign({ id, email }, JWTSECRET);

export default server.createHandler({ path });
