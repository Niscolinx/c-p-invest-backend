const { buildSchema } = require('graphql')

module.exports = buildSchema(`

    type fundAccount {
        _id: ID!
        amount: String!
        currency: String!
        proofUrl: String!
        creator: User!
        createdAt: String!
        UpdatedAt: String!
    }

    type User {
        _id: ID!
        username: String!
        email: String!
        fullname: String!
        password: String!
        secretQuestion: String!
        secretAnswer: String!
        ethereumAccount: String
        bitcoinAccount: String
         status: String!
        createdAt: String!
        updatedAt: String!
        fundAccount: [fundAccount!]!
    }

    type AuthData {
        token: String!
        userId: String!
    }

    input UserInputData {
        username: String!
        email: String!
        fullname: String!
        password: String!
        secretQuestion: String!
        secretAnswer: String!
        ethereumAccount: String
        bitcoinAccount: String
    }

    input PostInputData {
        amount: String!
        currency: String!
        proofUrl: String!
    }

    
    type RootMutation {
        createUser(userData: UserInputData): User!
        fundAccount(postData: PostInputData): fundAccount!
        updatePost(id: ID!, postData: PostInputData): Post!
        deletePost(id: ID!): Boolean
        updateStatus(status: String!): User!
    }

    type PostData {
        Post: [Post!]!
        totalPosts: Int!
        lastPage: Int
    }

    type rootQuery{
        login(email: String, password: String): AuthData!
        getPosts(page: Int): PostData!
        post(id: ID!): Post!
        getUser: User!
    }

    schema {
        query: rootQuery
        mutation: RootMutation
    }
`)
