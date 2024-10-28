import express from "express";
import * as myDb from "../db/mySqliteDB.js";

const router = express.Router();

/* GET home page. */
router.get("/", async function (req, res, next) {
  res.redirect("/references");
});

// Route to handle seller login/register
router.get("/seller", (req, res) => {
  const msg = req.query.msg || null;
  res.render("./pages/seller" , {msg});
});

/* POST request to check seller authentication */
// Check if the seller exists
router.post("/checkSeller", async (req, res) => {
  const email = req.body.sellerEmail;

  try {
    // Call the function to check if the seller exists
    const seller = await myDb.checkSellerExist(email);
    console.log("👉 seller", seller);

    if (seller) {
      // If seller exists, redirect to options page with farmer_id as query parameter
      const farmerId = seller.farmer_id; // Assuming you get farmer_id from the seller object
      res.redirect(`/seller/sellerOptions?farmer_id=${farmerId}`);
    } else {
      // If seller doesn't exist, redirect to the seller registration page
      res.redirect("/seller/?msg=Oops! User not Found");
    }
  } catch (error) {
    console.error("Error checking seller existence:", error);
    res.status(500).send("Server error");
  }
});

/* Seller Options */
router.get('/seller/sellerOptions', async (req, res) => {
  const farmerId = req.query.farmer_id; // Get farmer_id from query parameters

  if (!farmerId) {
      return res.status(400).send('Farmer ID is required');
  }

  // Fetch expenses and inventory based on farmerId
  try {
      const expenses = await myDb.getExpensesByFarmerId(farmerId); // Define this function to fetch expenses
      const inventory = await myDb.getInventoryByFarmerId(farmerId); // Define this function to fetch inventory

      // Render the seller options page
      res.render('pages/sellerOptions', { // Fixed the path to the render method
          Expense: expenses,
          Inventory: inventory,
          farmer_id: farmerId, // Pass farmer_id to the template
          currentPage: 1, // Example value, adjust as needed
          lastPage: 1 // Example value, adjust as needed
      });
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

/*GET route for SellerOptions*/
router.get("/seller/sellerOptions", (req, res) => {
  const msg = req.query.msg || null;
  res.render("./pages/sellerOptions" , {msg});
});

/* GET seller registration page */
router.get("/registerSeller", (req, res) => {
  res.render("./pages/registerSeller");
});

/* POST seller registration page */
router.post("/createSeller", async (req, res, next) => {
  console.log("Seller", req.body);
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const email = req.body.email;
  const zip_code = req.body.zip_code;
  const contact_number = req.body.contact_number;
  const current_address = req.body.current_address;
  const city = req.body.city;
  const state = req.body.state;
  if (!contact_number) {
    return res.status(400).send('Contact number is required.');
  }
  try {
    const seller = await myDb.checkSellerExist(email);

    if (seller) {
      // If seller exists, render options page for the seller
      res.redirect("/seller/?msg=Seller Exsits. Please Login with Registered Emaild");
    } else {
      let updateResult = await myDb.addSeller(first_name,last_name,email,zip_code,contact_number,current_address,city,state);
      console.log("addSeller", updateResult);
  
      if (updateResult && updateResult.changes === 1) {
        res.redirect(`/seller/?msg=User Created Successfully. Please Login with Registered Email`);
      } else {
        res.redirect(`/seller/${email}/edit?msg=Error adding author`);
      }
    } 
  }
    catch (err) {
      next(err);
  }
});

/*view expense*/
router.get("/seller/:farmer_id/viewExpense", async (req, res, next) => {
  const farmer_id = req.params.farmer_id;
  const query = req.query.q || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  try {
    let Expense = await myDb.getExpense(farmer_id);
    console.log("expense", Expense);
    res.render("./pages/viewExpense", { 
      Expense, 
      query, 
      msg, 
      currentPage: page, 
      lastPage: 1 
    })
  } catch (err) {
    next(err);
  }
});
/*view Inventory*/
router.get("/seller/:farmer_id/viewInventory", async (req, res, next) => {
  const farmer_id = req.params.farmer_id;
  const query = req.query.q || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  try {
    let Inventory = await myDb.getInventory(farmer_id);
    console.log("->>> Inventory", Inventory);
    res.render("./pages/viewInventory", { 
      Inventory, 
      query, 
      msg, 
      currentPage: page, 
      lastPage: 1 
    })
  } catch (err) {
    next(err);
  }
});

router.get("/seller/:farmer_id/addExpense", async (req, res) => {
  const farmer_id = req.params.farmer_id;
  res.render("./pages/AddExpense", {farmer_id});
});

/*Add expense*/
router.post("/seller/:farmer_id/addExpense", async (req, res, next) => {
  const query = req.query.q || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  const category_name = req.body.category_name;
  const date = req.body.date;
  const amount = req.body.amount;
  const farmer_id = req.params.farmer_id;
  try {
    console.log("Inserting for farmer:", farmer_id);
    let updateResult = await myDb.addExpense(farmer_id,category_name, date, amount);
    console.log("➡️ addExpense", updateResult);
      if (updateResult && updateResult.changes === 1) {
        res.redirect(`/seller/sellerOptions?farmer_id=${farmer_id}`);
      } else {
        res.redirect(`/seller/${farmer_id}/addExpense?msg=Error adding expense`);
      }
    } catch (err) {
    next(err);
  }
});

router.post("/seller/:farmer_id/addInventory", async (req, res, next) => {
  const query = req.query.q || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  const quantity_in_bundles = req.body.quantity_in_bundles;
  const product_name = req.body.product_name;
  const created_at = req.body.created_at;
  const farmer_id = req.params.farmer_id;
  try {
    let updateResult = await myDb.addInventory(farmer_id,quantity_in_bundles, product_name, created_at);
    console.log("addInventory", updateResult);
  
      if (updateResult && updateResult.changes === 1) {
        res.redirect(`/seller/sellerOptions?farmer_id=${farmer_id}`);
      } else {
        res.redirect(`/seller/${farmer_id}/addInventory?msg=Error adding inventory`);
      }
    } catch (err) {
    next(err);
  }
});

router.get("/seller/:expense_id/editExpense", async (req, res, next) => {
  const expense_id = req.params.expense_id;
  const query = req.query.q || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  try {
    console.log("Expense_id in get editExpense", expense_id);
    let Expense = await myDb.getExpensesByExpenseId(expense_id);
    console.log("Expense from get", Expense);
    res.render("./pages/editExpense", { 
      Expense, 
      query, 
      msg, 
      currentPage: page, 
      lastPage: 1 
    })
  } catch (err) {
    next(err);
  }
});
router.post("/seller/:expense_id/editExpense", async (req, res, next) => {
  const { expense_id, amount, date } = req.body;
  try {
    console.log("Expense_id in update", expense_id);
    let UpdateExpense = await myDb.updateExpensesById(233, amount, date);
    console.log("*******Update", UpdateExpense);

    if (UpdateExpense && UpdateExpense.changes==1) {
      res.redirect("/references/?msg=Expense Updated");
    } else {
      res.redirect("/seller/SellerOptions/?msg=Error Updating");
    }
  } catch (err) {
    next(err);
  }
});

router.get("/seller/:expense_id/deleteExpense", async (req, res, next) => {
  const expense_id = req.params.expense_id;

  try {
    console.log("Farmer_Id in DeleteExpense", expense_id);
    let deleteResult = await myDb.deleteExpenseById(expense_id);
    let deleteForeign = await myDb.deleteForeignById(expense_id);
    console.log("delete", deleteResult);
    console.log("delete", deleteForeign);

    if ((deleteResult && deleteResult.changes === 1) && (deleteForeign && deleteForeign.changes === 1)){
      res.redirect("/references?msg=Deleted");
    } else {
      res.redirect("/references/?msg=Error Deleting");
    }
  } catch (err) {
    next(err);
  }
});

router.get("/seller/:farmer_id/deleteInventory", async (req, res, next) => {
  const farmer_id = req.params.farmer_id;
  const inventory = req.body;

  try {
    let deleteResult = await myDb.deleteInventoryById(farmer_id, inventory);
    console.log("delete", deleteResult);

    if (deleteResult && deleteResult.changes === 1) {
      res.redirect("/references/?msg=Deleted");
    } else {
      res.redirect("/references/?msg=Error Deleting");
    }
  } catch (err) {
    next(err);
  }
});


router.get("/seller/:farmer_id/editInventory", async (req, res, next) => {
  const farmer_id = req.params.farmer_id;
  const query = req.query.q || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  try {
    let Inventory = await myDb.getInventoryByFarmerId(farmer_id);
    console.log("Expense", Inventory);
    res.render("./pages/editInventory", { 
      Inventory, 
      query, 
      msg, 
      currentPage: page, 
      lastPage: 1 
    })
  } catch (err) {
    next(err);
  }
});

router.post("/seller/:farmer_id/editInventory", async (req, res, next) => {
  const inventory = req.body;
  const farmer_id = req.params.farmer_id;
  try {
    console.log("farmer_id in update", farmer_id, inventory);
    let UpdateInventory = await myDb.updateInventoryById(farmer_id, inventory);
    console.log("Update", UpdateExpense);

    if (UpdateInventory && UpdateInventory.changes==1) {
      res.redirect("/seller/SellerOptions/?msg=Updated");
    } else {
      res.redirect("/seller/SellerOptions/?msg=Error Updating");
    }
  } catch (err) {
    next(err);
  }
});

// http://localhost:3000/references?pageSize=24&page=3&q=John
router.get("/references", async (req, res, next) => {
  const query = req.query.q || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  try {

    res.render("./pages/index", {
      query,
      msg,
      currentPage: page
    });
  } catch (err) {
    next(err);
  }
});
export default router;
