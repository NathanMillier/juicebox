const { Client } = require("pg");

const client = new Client({
  password: "Ninaan1030",
  database: "juicebox",
  user: "postgres",
});

const createUser = async ({ username, password, name, location }) => {
  try {
    const { rows } = await client.query(
      `
    INSERT INTO users (username, password, name, location)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (username) DO NOTHING
    RETURNING *;
    `,
      [username, password, name, location]
    );
    return rows;
  } catch (error) {
    throw error;
  }
};

const updateUser = async (userID, fields = {}) => {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  if (setString.length === 0) {
    return;
  }

  try {
    const result = await client.query(
      `
    UPDATE users
    SET ${setString}
    WHERE id = ${userID}
    RETURNING *;
    `,
      Object.values(fields)
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
};

const getAllUsers = async () => {
  try {
    const { rows } = await client.query(
      `SELECT id, username, name, location, active FROM users;`
    );
    return rows;
  } catch (error) {
    throw error;
  }
};

// THIS IS MY FUNCTION
// const getUserById = async (userID) => {
//   try {
//     const response = await client.query(`
//   SELECT id, username, name, location, active FROM users
//   WHERE id = ${userID};
//   `);
//     if (!response.rows) {
//       return null;
//     }
//     response.rows[0].posts = await getPostsByUser(userID);
//     return response.rows[0];
//   } catch (error) {
//     throw error;
//   }
// };

// THIS IS NOT MY FUNCTION. I COPY PASTED IT FROM THE WORKSHOP AS MINE KEPT COMING BACK AS UNDEFINED AND GIVING ME AN ERROR
// OF CONNECTION UNEXPECTEDLY DISCONNECTED
async function getUserById(userId) {
  try {
    const {
      rows: [user],
    } = await client.query(`
      SELECT id, username, name, location, active
      FROM users
      WHERE id=${userId};
    `);

    if (!user) {
      return null;
    }

    user.posts = await getPostsByUser(userId);

    return user;
  } catch (error) {
    throw error;
  }
}

const createPost = async ({ authorId, title, content }) => {
  try {
    const response = await client.query(
      `
  INSERT INTO posts ("authorId", title, content) VALUES ($1, $2, $3)
  RETURNING*;
  `,
      [authorId, title, content]
    );
    return response.rows;
  } catch (error) {
    throw error;
  }
};

const updatePost = async (postID, fields = {}) => {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  if (setString.length === 0) {
    return;
  }

  try {
    const result = await client.query(
      `
    UPDATE posts
    SET ${setString}
    WHERE id = ${postID}
    RETURNING *;
    `,
      Object.values(fields)
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
};

const getAllPosts = async () => {
  try {
    const response = await client.query(`
  SELECT * FROM posts;
  `);
    return response.rows;
  } catch (error) {
    throw error;
  }
};

// THIS IS MY FUNCTION THAT DIDNT WORK
// const getPostsByUser = async (userID) => {
//   const response = client.query(
//     `
//   SELECT title, content, "authorId" FROM posts
//   WHERE "authorId" = ${userID};
//   `
//   );
//   return response.rows;
// };

// THIS IS NOT MY FUNCTION. I COPY PASTED IT FROM THE WORKSHOP AS MINE KEPT COMING BACK AS UNDEFINED AND GIVING ME AN ERROR
// OF CONNECTION UNEXPECTEDLY DISCONNECTED
async function getPostsByUser(userId) {
  try {
    const { rows } = await client.query(`
      SELECT * 
      FROM posts
      WHERE "authorId"=${userId};
    `);

    return rows;
  } catch (error) {
    throw error;
  }
}

const createTags = async (tagList) => {
  if (tagList.length === 0) {
    return;
  }

  const insertValues = tagList.map((_, index) => `$${index + 1}`).join("),(");

  const selectValues = tagList.map((_, index) => `$${index + 1}`).join(", ");

  try {
    await client.query(
      `
      INSERT INTO tags (name)
      VALUES (${insertValues})
      ON CONFLICT (name) DO NOTHING
    `,
      tagList
    );

    const response = await client.query(
      `
    SELECT * FROM tags
    WHERE name
    IN (${selectValues});
    `,
      tagList
    );
    return response.rows;
  } catch (error) {
    throw error;
  }
};

const createPostTag = async (postId, tagId) => {
  try {
    await client.query(
      `
      INSERT INTO post_tags ("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING
      RETURNING *;
    `,
      [postId, tagId]
    );
  } catch (error) {
    throw error;
  }
};

const addTagsToPost = async (postId, tagList) => {
  try {
    const createPostTagPromise = tagList.map((tag) =>
      createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromise);
    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
};

const getPostById = async (postId) => {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
      SELECT * FROM posts
      WHERE id = $1;
    `,
      [postId]
    );

    const { rows: tags } = await client.query(
      `
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id=post_tags."tagId"
      WHERE post_tags."postId"=$1;
    `,
      [postId]
    );

    const {
      rows: [author],
    } = await client.query(
      `
      SELECT id, username, name, location
      FROM users
      WHERE id=$1;
    `,
      [post.authorId]
    );

    post.tags = tags;
    post.author = author;

    delete post.authorId;

    return post;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
  getUserById,
  createTags,
  addTagsToPost,
};
