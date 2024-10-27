const mongoose = require("mongoose")
const connection = mongoose.connect(process.env.mongoURL)

module.exports = {
    connection,
}






// mongoose.connection.on('error', (error) => {
//   console.error('Database connection error:', error);
// });

// mongoose.connection.on('disconnected', () => {
//   console.error('Database disconnected. Attempting to reconnect...');
//   reconnectDatabase();
// });

// const reconnectDatabase = async () => {
//   try {
//     await mongoose.connect(DB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true });
//     console.log('Reconnected to the database');
//   } catch (error) {
//     console.error('Reconnection attempt failed:', error);
//     setTimeout(reconnectDatabase, 5000); 
//   }
// };




