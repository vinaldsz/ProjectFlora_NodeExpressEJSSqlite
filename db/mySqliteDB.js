import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function checkSellerExist(sellerEmail) {
  console.log("seller Authentication", sellerEmail);

  const db = await open({
    filename: "./db/ProjectFlora.db",
    driver: sqlite3.Database,
  });
  const stmt = await db.prepare(`
    SELECT * FROM Farmer
    WHERE email = @sellerEmail;
  `);
  const params = {
    "@sellerEmail": sellerEmail,
  };
  try {
    // Execute the query and return the result (farmer record if found)
    return await stmt.get(params);
  } finally {
    // Finalize statement and close the database connection
    await stmt.finalize();
    await db.close();
  }
}
export async function addSeller(first_name,last_name,email,zip_code,contact_number,current_address,city,state) {
  const db = await open({
    filename: "./db/ProjectFlora.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(`INSERT INTO
    Farmer(first_name,last_name,email,zip_code,contact_number,current_address,city,state)
    VALUES (@first_name,@last_name,@email,@zip_code,@contact_number,@current_address,@city,@state);`);

    const params = {
      "@first_name": first_name,
      "@last_name": last_name,
      "@email": email,
      "@zip_code": zip_code,
      "@contact_number": contact_number,
      "@current_address": current_address,
      "@city": city,
      "@state": state
    };
  
    try {
      return await stmt.run(params);
    } finally {
      await stmt.finalize();
      db.close();
    }
  }

export async function addExpense(farmer_id, category_name, date, amount) {
  const db = await open({
    filename: "./db/ProjectFlora.db",
    driver: sqlite3.Database,
  });
  
  const stmt = await db.prepare(`INSERT INTO Expense(expense_category_id, amount, date) 
    SELECT expense_category_id, @amount, @date
    FROM Expense_Category
    where lower(category_name) = lower(@category_name)`);

  const addKeys = await db.prepare(`INSERT INTO Farmer_Expense(farmer_id, expense_id) 
    SELECT @farmer_id, e.expense_id
    FROM Expense e
    INNER JOIN Expense_Category ec
    ON e.expense_category_id = ec.expense_category_id
    where (amount == @amount) and (date == @date) and (lower(ec.category_name) == lower(@category_name))`);

    const params = {
      "@category_name": category_name,
      "@amount": amount,
      "@date": date
    }

    const params1 = {
      "@farmer_id": farmer_id,
      "@category_name": category_name,
      "@amount": amount,
      "@date": date
    }

    let resultKey;

    try {
      const result = await stmt.run(params);
      console.log(result);
      if (result.changes ==1) {
        resultKey = await addKeys.run(params1);
        if (resultKey.changes ==1) {
          return result;
        } 
      } 
    }
    catch (error) {
      console.error("Error:", error);
    }
    finally {
      // await resultKey.finalize();
      await stmt.finalize();
      await addKeys.finalize();
      db.close();
    }
}
export async function getReferences(query, page, pageSize) {
  console.log("getReferences", query);

  const db = await open({
    filename: "./db/database.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(`
    SELECT * FROM Reference
    WHERE title LIKE @query
    ORDER BY published_on DESC
    LIMIT @pageSize
    OFFSET @offset;
  `);

  const params = {
    "@query": query + "%",
    "@pageSize": pageSize,
    "@offset": (page - 1) * pageSize,
  };

  try {
    return await stmt.all(params);
  } finally {
    await stmt.finalize();
    db.close();
  }
}

export async function getExpensesByFarmerId(farmer_id) {
  console.log("getExpense", farmer_id);

  const db = await open({
    filename: "./db/ProjectFlora.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(`
    SELECT f.first_name, f.last_name, f.farmer_id, e.expense_id, e.amount, e.date, ec.category_name FROM Farmer f
    INNER JOIN Farmer_Expense fe
    ON f.farmer_id=fe.farmer_id
    INNER JOIN Expense e ON
    fe.expense_id = e.expense_id
    INNER JOIN Expense_Category ec
    ON e.expense_category_id = ec.expense_category_id
    where f.farmer_id=?
    ORDER BY date desc`);

  console.log(stmt);
    try {
      return await stmt.all(farmer_id); // Return all rows matching the query
      console.log("Inside try");
    } finally {
      await stmt.finalize();
      db.close();
    }
}

export async function getExpensesByExpenseId(expense_id) {
  console.log("getExpenseByExpenseID", expense_id);

  const db = await open({
    filename: "./db/ProjectFlora.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(` SELECT e.expense_id, e.amount, e.date, e.expense_category_id, ec.category_name FROM Expense e 
    INNER JOIN Expense_Category ec 
    ON e.expense_category_id = ec.expense_category_id 
    where expense_id = @expense_id`);

    const params = {
      "@expense_id": expense_id
    };
  
    try {
      return await stmt.get(params);
    } finally {
      await stmt.finalize();
      db.close();
    }

}

export async function getFarmerByExpenseId(expense_id) {
  console.log("getFarmerByExpenseID", expense_id);

  const db = await open({
    filename: "./db/ProjectFlora.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(` SELECT farmer_id, expense_id FROM Farmer_Expense
    where expense_id = @expense_id`);

  console.log(stmt);
    try {
      return await stmt.all(expense_id); // Return all rows matching the query
    } finally {
      await stmt.finalize();
      db.close();
    }

}
export async function updateExpensesById(expense_id, amount, date) {
  console.log("updateExpenseById", expense_id, amount, date);

  const db = await open({
    filename: "./db/ProjectFlora.db",
    driver: sqlite3.Database,
  });
  const stmt = await db.prepare(`UPDATE Expense
    SET
      amount = @amount,
      date = @date
    WHERE 
      expense_id = @expense_id`);
  
  const params = {
    "@amount": amount,
    "@date": date,
    "@expense_id": expense_id,

  }

  try {
    const result = await stmt.run(params);
    return result;
  }finally { 
    await stmt.finalize();
    db.close();
  }
}

export async function updateInventoryById(farmer_id, inventory) {
  console.log("updateExpenseById", farmer_id, inventory);

  const db = await open({
    filename: "./db/ProjectFlora.db",
    driver: sqlite3.Database,
  });
  const stmt = await db.prepare(`UPDATE Harvest
    SET
      quantity_in_bundles = @quantity_in_bundles
    WHERE 
      farmer_id = @farmer_id and product_id = @product_id and created_at = @date`);
  
  const params = {
    "farmer_id": farmer_id,
    "quantity_in_bundles": inventory.quantity_in_bundles,
    "product_id": inventory.product_id,
    "date": inventory.date
  };
  try {
    return await stmt.run(params); // Return all rows matching the query
    console.log("Inside try");
  } finally {
    await stmt.finalize();
    db.close();
  }
}
export async function deleteExpenseById(expense_id) {
  console.log("deleteExpenseByID", expense_id);

  const db = await open({
    filename: "./db/ProjectFlora.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(`
    DELETE FROM Expense
    WHERE
      expense_id = @expense_id
  `);

  const params = {
    "@expense_id": expense_id,
  };

  try {
    return await stmt.run(params);
  } finally {
    await stmt.finalize();
    db.close();
  }
}
export async function deleteForeignById(expense_id) {
  console.log("deleteForeignByID", expense_id);

  const db = await open({
    filename: "./db/ProjectFlora.db",
    driver: sqlite3.Database,
  });

  const delstmt = await db.prepare(`
    DELETE FROM Farmer_Expense
    WHERE expense_id = @expense_id
    `);

  const params = {
    "@expense_id": expense_id,
  };

  try {
    return await delstmt.run(params);
  } finally {
    await delstmt.finalize();
    db.close();
  }
}
export async function deleteInventoryById(farmer_id, inventory) {
  console.log("deleteInventoryByID", farmer_id);

  const db = await open({
    filename: "./db/ProjectFlora.db",
    driver: sqlite3.Database,
  });

  console.log("👉 farmer_id", farmer_id);

  const stmt = await db.prepare(`
    DELETE FROM Harvest
    WHERE
      (farmer_id = @farmer_id) and (product_id = @product_id) and(created_at=@date);
  `);

  const params = {
    "@farmer_id": farmer_id,
    "product_id": inventory.product_id,
    "date": inventory.date
  };

  try {
    return await stmt.run(params);
  } finally {
    await stmt.finalize();
    db.close();
  }
}

export async function getInventoryByFarmerId(farmer_id) {
  console.log("getInventory", farmer_id);

  const db = await open({
    filename: "./db/ProjectFlora.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(`
    SELECT f.first_name, f.last_name, h.farmer_id, h.product_id, h.quantity_in_bundles, p.product_name, h.created_at
    FROM Farmer f
    INNER JOIN Harvest h
    ON f.farmer_id=h.farmer_id
    INNER JOIN Product p
    ON h.product_id = p.product_id
    WHERE f.farmer_id=@farmer_id
    `);

  console.log(stmt);
    try {
      return await stmt.all(farmer_id); // Return all rows matching the query
      console.log("Inside try");
    } finally {
      await stmt.finalize();
      db.close();
    }
}

export async function addInventory(farmer_id, quantity_in_bundles, product_name, created_at) {
  const db = await open({
    filename: "./db/ProjectFlora.db",
    driver: sqlite3.Database,
  });

  console.log("Inserting with values:", { farmer_id, quantity_in_bundles, product_name, created_at });

  const productStmt = await db.prepare(`SELECT product_id FROM Product WHERE lower(product_name) = lower(?)`);
  const productResult = await productStmt.get(product_name);
  await productStmt.finalize(); // Finalize the product statement

  if (!productResult) {
    console.error("Product not found:", product_name);
    return { changes: 0 }; // Return early if product is not found
  }

  const productId = productResult.product_id;

  // Insert into Harvest table
  const stmt = await db.prepare(`INSERT INTO Harvest(farmer_id, product_id, quantity_in_bundles, created_at) 
    VALUES (?, ?, ?, ?)`);

  // Ensure params are in the right order
  const params = [farmer_id, productId, quantity_in_bundles, created_at];

  try {
    console.log("Inside try");
    const result = await stmt.run(params); 
    console.log("Insert result:", result);
    return result; // Return the result
  } catch (error) {
    console.error("Error inserting into Inventory:", error);
    throw error; // Rethrow to handle in the calling function
  } finally {
    await stmt.finalize(); 
    await db.close(); 
  }
}

export async function getReferencesCount(query) {
  console.log("getReferences", query);

  const db = await open({
    filename: "./db/database.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM Reference
    WHERE title LIKE @query;
  `);

  const params = {
    "@query": query + "%",
  };

  try {
    return (await stmt.get(params)).count;
  } finally {
    await stmt.finalize();
    db.close();
  }
}

export async function getReferenceByID(reference_id) {
  console.log("getReferenceByID", reference_id);

  const db = await open({
    filename: "./db/database.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(`
    SELECT * FROM Reference
    WHERE reference_id = @reference_id;
  `);

  const params = {
    "@reference_id": reference_id,
  };

  try {
    return await stmt.get(params);
  } finally {
    await stmt.finalize();
    db.close();
  }
}

export async function updateReferenceByID(reference_id, ref) {
  console.log("updateReferenceByID", reference_id, ref);

  const db = await open({
    filename: "./db/database.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(`
    UPDATE Reference
    SET
      title = @title,
      published_on = @published_on
    WHERE
      reference_id = @reference_id;
  `);

  const params = {
    "@reference_id": reference_id,
    "@title": ref.title,
    "@published_on": ref.published_on,
  };

  try {
    return await stmt.run(params);
  } finally {
    await stmt.finalize();
    db.close();
  }
}

export async function deleteReferenceByID(reference_id) {
  console.log("deleteReferenceByID", reference_id);

  const db = await open({
    filename: "./db/database.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(`
    DELETE FROM Reference
    WHERE
      reference_id = @reference_id;
  `);

  const params = {
    "@reference_id": reference_id,
  };

  try {
    return await stmt.run(params);
  } finally {
    await stmt.finalize();
    db.close();
  }
}

export async function insertReference(ref) {
  const db = await open({
    filename: "./db/database.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(`INSERT INTO
    Reference(title, published_on)
    VALUES (@title, @published_on);`);

  try {
    return await stmt.run({
      "@title": ref.title,
      "@published_on": ref.published_on,
    });
  } finally {
    await stmt.finalize();
    db.close();
  }
}

export async function getAuthorsByReferenceID(reference_id) {
  console.log("getAuthorsByReferenceID", reference_id);

  const db = await open({
    filename: "./db/database.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(`
    SELECT * FROM Reference_Author
    NATURAL JOIN Author
    WHERE reference_id = @reference_id;
  `);

  const params = {
    "@reference_id": reference_id,
  };

  try {
    return await stmt.all(params);
  } finally {
    await stmt.finalize();
    db.close();
  }
}

export async function addAuthorIDToReferenceID(reference_id, author_id) {
  console.log("addAuthorIDToReferenceID", reference_id, author_id);

  const db = await open({
    filename: "./db/database.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(`
    INSERT INTO
    Reference_Author(reference_id, author_id)
    VALUES (@reference_id, @author_id);
  `);

  const params = {
    "@reference_id": reference_id,
    "@author_id": author_id,
  };

  try {
    return await stmt.run(params);
  } finally {
    await stmt.finalize();
    db.close();
  }
}

export async function getAuthors(query, page, pageSize) {
  console.log("getAuthors query", query);

  const db = await open({
    filename: "./db/database.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(`
    SELECT * FROM Author
    WHERE 
      first_name LIKE @query OR 
      last_name LIKE @query
    ORDER BY last_name DESC
    LIMIT @pageSize
    OFFSET @offset;
  `);

  const params = {
    "@query": query + "%",
    "@pageSize": pageSize,
    "@offset": (page - 1) * pageSize,
  };

  try {
    return await stmt.all(params);
  } finally {
    await stmt.finalize();
    db.close();
  }
}

export async function getAuthorsCount(query) {
  console.log("getAuthorsCount query", query);

  const db = await open({
    filename: "./db/database.db",
    driver: sqlite3.Database,
  });

  const stmt = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM Author
    WHERE 
      first_name LIKE @query OR 
      last_name LIKE @query;
  `);

  const params = {
    "@query": query + "%",
  };

  try {
    return (await stmt.get(params)).count;
  } finally {
    await stmt.finalize();
    db.close();
  }
}
