const { buildSchema } = require('graphql')

module.exports = buildSchema(`

    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        UpdatedAt: String!
    }

    type User {
        _id: ID!
        username: String!
        email: String!
        password: String!
        status: String!
        posts: [Post!]!
    }

    type AuthData {
        token: String!
        userId: String!
    }

    input UserInputData {
        username: String!
        email: String!
        password: String
    }

    input PostInputData {
        title: String!
        content: String!
        imageUrl: String!
    }

    
    type RootMutation {
        createUser(userData: UserInputData): User!
        createPost(postData: PostInputData): Post!
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
