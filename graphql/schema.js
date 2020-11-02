const { buildSchema } = require('graphql')

module.exports = buildSchema(`

    type FundAccount {
        _id: ID!
        amount: String!
        currency: String!
        proofUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
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
        role: String!
        status: String!
        createdAt: String!
        updatedAt: String!
        FundAccount: [FundAccount!]!
    }

    type AuthData {
        token: String!
        userId: String!
        role: String!
        email: String!
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
    type ProfileData {
        username: String
        email: String
        fullname: String
        password: String
        city: String
        phone: String
        profilePic: String
        country: String
        ethereumAccount: String
        bitcoinAccount: String
        createdAt: String
        updatedAt: String
    }
    input PostProfileData {
        username: String
        email: String
        profilePic: String
        fullname: String
        password: String
        city: String
        phone: String
        country: String
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
        createUpdateProfile(updateProfileData: PostProfileData): ProfileData!
        updatePost(id: ID!, postData: PostFundData): FundAccount!
        deletePost(id: ID!): Boolean
        updateStatus(status: String!): User!
    }

    type PostData {
        FundAccount: [FundAccount!]!
        totalPosts: Int!
        lastPage: Int
    }
    type getFundData {
        getFund: [FundAccount!]!     
    }

    type rootQuery{
        login(email: String, password: String): AuthData!
        getFunds: getFundData!
        getPosts(page: Int): PostData!
        post(id: ID!): FundAccount!
        getUser: User!
    }

    schema {
        query: rootQuery
        mutation: RootMutation
    }
`)
