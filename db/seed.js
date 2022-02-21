const {
  client,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
  getUserById,
} = require("./index");

async function dropTables() {
  try {
    console.log("Starting to drop the tables...");
    await client.query(`
      DROP TABLE IF EXISTS post_tags;
      DROP TABLE IF EXISTS tags; 
      DROP TABLE IF EXISTS posts;
      DROP TABLE IF EXISTS users;
    `);
    console.log("Finished dropping the tables...");
  } catch (error) {
    console.error("Error dropping tables...");
    throw error; // we pass the error up to the function that calls dropTables
  }
}

// this function should call a query which creates all tables for our database
async function createTables() {
  try {
    console.log("Starting to create new tables...");
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY, 
        username varchar(255) UNIQUE NOT NULL,
        password varchar(255) NOT NULL,
        name varchar(255) NOT NULL,
        location varchar(255) NOT NULL,
        active BOOLEAN DEFAULT true
      );

      CREATE TABLE posts (
        id SERIAL PRIMARY KEY,
        "authorId" INTEGER REFERENCES users(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        active BOOLEAN DEFAULT true
      );

      CREATE TABLE tags (
        id SERIAL PRIMARY KEY,
        name varchar(255) UNIQUE NOT NULL
      );
      
      CREATE TABLE post_tags (
        postId INTEGER REFERENCES posts(id) UNIQUE,
        tagId INTEGER REFERENCES tags(id) UNIQUE
      );
    `);
    console.log("Finished creating the tables...");
  } catch (error) {
    console.error("Error creating the tables...");
    throw error; // we pass the error up to the function that calls createTables
  }
}

const createInitialUsers = async () => {
  try {
    console.log("Starting to create users...");
    const albert = await createUser({
      username: "Albert",
      password: "bertie99",
      name: "Albert",
      location: "Honolulu",
    });

    const glamgal = await createUser({
      username: "GlamGal",
      password: "aPasswordForGlamGall",
      name: "Gloria",
      location: "Key west",
    });

    const sandra = await createUser({
      username: "Sandra",
      password: "prout",
      name: "Sandra",
      location: "Bahamas",
    });

    console.log("Finished creating users...");
  } catch (error) {
    console.error("Error creating users...");
    throw error;
  }
};

const createInitialPosts = async () => {
  try {
    const [albert, sandra, glamgal] = await getAllUsers();
    await createPost({
      authorId: albert.id,
      title: "First Post",
      content: "This is my first post I hope you all welcome me nicely...",
    });
  } catch (error) {
    throw error;
  }
};

async function rebuildDB() {
  try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialPosts();
  } catch (error) {
    console.error(error);
  }
}

//NOT MY FUNCTION, THIS IS THE ONE FROM THE WORKSHOP.
async function testDB() {
  try {
    console.log("Starting to test database...");

    console.log("Calling getAllUsers");
    const users = await getAllUsers();
    console.log("Result:", users);

    console.log("Calling updateUser on users[0]");
    const updateUserResult = await updateUser(users[0].id, {
      name: "Newname Sogood",
      location: "Lesterville, KY",
    });
    console.log("Result:", updateUserResult);

    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("Result:", posts);

    console.log("Calling updatePost on posts[0]");
    const updatePostResult = await updatePost(posts[0].id, {
      title: "New Title",
      content: "Updated Content",
    });
    console.log("Result:", updatePostResult);

    console.log("Calling getUserById with 1");
    const albert = await getUserById(1);
    console.log("Result:", albert);

    console.log("Finished database tests!");
  } catch (error) {
    console.log("Error during testDB");
    throw error;
  }
}

rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());
