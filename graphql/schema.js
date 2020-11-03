const { buildSchema } = require('graphql')

module.exports = buildSchema(`

    type FundAccount {
        _id: ID!
        amount: Int!
        currency: String!
        proofUrl: String!
        creator: User!
        status: String
        fundNO: Int
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
        city: String
        phone: String
        country: String
        role: String!
        userNO: Int
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
        oldEmail: String
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
        amount: String
        currency: String!
        proofUrl: String!
    }

    input PostId {
        id: String
    }
    
    type RootMutation {
        createUser(userData: UserInputData): User!
        createFundAccount(fundData: PostFundData): FundAccount!
        createUpdateProfile(updateProfileData: PostProfileData): ProfileData!
        createFundAccountApproval(PostId: PostId): FundAccount!
        updatePost(id: ID!, postData: PostFundData): FundAccount!
        deletePost(id: ID!): Boolean
        updateStatus(status: String!): User!
    }

    type getFundsData {
        status: String
        amount: Int
        proofUrl: String
        currency: String
        creator: String
        fundNO: Int
        createdAt: String
        updatedAt: String
    }
    type PostData {
        FundAccount: [FundAccount!]!
        totalPosts: Int!
        lastPage: Int
    }
    type getFundData {
        fundData: [getFundsData!]!   
         getFund: [FundAccount!]!

    }
    type getUsersData {
        getUser: [User!]! 
        userFundAccount: [FundAccount!]!    
    }
    type getUserData {
        user: User!
        userFundAccount: [FundAccount!]!    
        userAccountBalance: Int!
    }

    type rootQuery{
        login(email: String, password: String): AuthData!
        getFunds: getFundData!
        getPosts(page: Int): PostData!
        post(id: ID!): FundAccount!
        getUser: getUserData!
        getUsers: getUsersData!
    }

    schema {
        query: rootQuery
        mutation: RootMutation
    }
`)
