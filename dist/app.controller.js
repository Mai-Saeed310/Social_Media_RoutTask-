"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_service_1 = require("./config/config.service");
const global_error_handling_1 = require("./common/utiliti/global-error-handling");
const user_controller_1 = require("./modules/auth/user.controller");
const connectionDB_1 = require("./DB/connectionDB");
const radis_service_1 = __importDefault(require("./common/service/radis.service"));
const post_controller_1 = require("./modules/posts/post.controller");
const graphql_1 = require("graphql");
const express_2 = require("graphql-http/lib/use/express");
const app = (0, express_1.default)();
const port = config_service_1.PORT;
const bootstrap = () => {
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many requests, please try again later."
    });
    (0, connectionDB_1.checkConncetionDB)();
    radis_service_1.default.redisConnection();
    app.use(express_1.default.json());
    app.use((0, cors_1.default)(), (0, helmet_1.default)(), limiter);
    app.use("/auth", user_controller_1.authRouter);
    app.use("/post", post_controller_1.postRouter);
    app.post("/send-notification", (req, res, next) => {
        console.log({ token: req.body.token });
    });
    app.use("{/*demo}", (req, res, next) => {
        throw new global_error_handling_1.AppError(`Url ${req.originalUrl} with method ${req.method} not found`, 404);
    });
    let GenderType = new graphql_1.GraphQLEnumType({
        name: "genderType",
        values: {
            male: { value: "male" },
            female: { value: "female" },
        }
    });
    let UserType = new graphql_1.GraphQLObjectType({
        name: "getUser",
        fields: {
            id: { type: graphql_1.GraphQLInt },
            age: { type: graphql_1.GraphQLInt },
            name: { type: graphql_1.GraphQLString },
            gender: { type: GenderType }
        }
    });
    const users = [
        {
            id: 1,
            name: "Mai",
            age: 24,
            gender: "female"
        }
    ];
    const schema = new graphql_1.GraphQLSchema({
        query: new graphql_1.GraphQLObjectType({
            name: "query",
            description: "query info",
            fields: {
                hi: {
                    type: graphql_1.GraphQLString,
                    resolve: () => {
                        return "hi";
                    }
                },
                hello: {
                    type: graphql_1.GraphQLString,
                    resolve: () => {
                        return "hello";
                    }
                }
            }
        }),
        mutation: new graphql_1.GraphQLObjectType({
            name: "mutation",
            fields: {
                createUser: {
                    type: new graphql_1.GraphQLList(UserType),
                    args: {
                        id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
                        age: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
                        name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
                        gender: { type: new graphql_1.GraphQLNonNull(GenderType) }
                    },
                    resolve: (parent, args) => {
                        const { id, name, age, gender } = args;
                        const userExist = users.find(user => user.id == id);
                        if (userExist) {
                            throw new global_error_handling_1.AppError("user already exist");
                        }
                        users.push({ id, name, age, gender });
                        return users;
                    }
                }
            }
        })
    });
    app.use("/graphql", (0, express_2.createHandler)({ schema }));
    app.use(global_error_handling_1.globalErrorHandler);
    app.listen(port, () => {
        console.log(`server is running on ${port}`);
    });
};
exports.bootstrap = bootstrap;
