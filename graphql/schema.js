const { buildSchema } = require('graphql')

module.exports = buildSchema(`

    type FundAccount {
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
        FundAccount: [FundAccount!]!
    }

    type AuthData {
        token: String!
        userId: String!
        username: String!
        email: String!
        fullname: String!
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

    input PostFundData {
        amount: String!
        currency: String!
        proofUrl: String!
    }

    
    type RootMutation {
        createUser(userData: UserInputData): User!
        createFundAccount(fundData: PostFundData): FundAccount!
        updatePost(id: ID!, postData: PostFundData): FundAccount!
        deletePost(id: ID!): Boolean
        updateStatus(status: String!): User!
    }

    type PostData {
        FundAccount: [FundAccount!]!
        totalPosts: Int!
        lastPage: Int
    }

    type rootQuery{
        login(email: String, password: String): AuthData!
        getPosts(page: Int): PostData!
        post(id: ID!): FundAccount!
        getUser: User!
    }

    schema {
        query: rootQuery
        mutation: RootMutation
    }
`)
