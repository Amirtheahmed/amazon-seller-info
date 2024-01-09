# Amazon Marketplace Seller Information Fetcher

This Node.js project is designed to fetch and display information about sellers on Amazon Marketplace. It utilizes Express.js for server handling and integrates various packages to scrape and process seller data from Amazon.

## Features
- **Express.js Framework:** Building a robust server to handle requests.
- **Dynamic Seller Information Fetching:** Fetches detailed information about Amazon sellers.
- **Error Handling:** Implements error handling for various scenarios like 404 and Amazon's request limits.
- **Input Validation:** Validates input data to ensure the correctness of seller ID and channel URL.

## Project Structure
The project is structured as follows:

- `app.js`: The main application file.
- `bin/`: Contains the executable file to start the server.
- `routes/`: Holds the routes for the application.
    - `sellerInfo.js`: Contains the logic to fetch and process seller information.
- `package.json`: Defines the project's metadata and dependencies.
- `package-lock.json`: Locks the versions of installed packages.

## Getting Started
To get this project up and running, follow these steps:

1. Clone the repository:
   ```bash
   git clone [repository-url]
