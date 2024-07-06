# 2-Factor-Authentication-Project
This project demonstrates a Two-Factor Authentication (2FA) system built using Node.js and the Speakeasy package. The system allows users to enable 2FA for their accounts, providing an additional layer of security.

## Introduction
Two-Factor Authentication (2FA) enhances the security of user accounts by requiring two forms of verification: something the user knows (password) and something the user has (2FA token). This project uses the Speakeasy package to generate and verify time-based one-time passwords (TOTP).

## How 2FA Works
1. **Secret Generation:**
   
   When a user enables 2FA, a unique secret key is generated for them. This secret key is shared between the server and the user's authenticator app.

2. **Token Generation:**
   
   The authenticator app uses the secret key to generate a TOTP, which changes every 30 seconds. This token is displayed to the user.

3. **Token Verification:**
   
   When the user logs in, they provide their username, password, and the current token from their authenticator app. The server verifies the token using the shared secret key.

## Installation
To set up the project locally, follow these steps:

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Simran-Patidar/2-Factor-Authentication-Project.git

2. **Install Dependencies:**
   ```sh
   npm install
   
3. **Set up environment variables:**
   Create a .env file in the root directory and add the following:
   ```sh
   ATLASDB_URL=mongodb+srv://simran-patidar:l2Ojdncl8ERF8Z0q@cluster0.czjklzb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   SECRET=abdjakfjsdghdilfGJBH
   
4. **Run the application:**
   ```sh
   npm start

## Technologies Used
**Node.js:** Server-side JavaScript runtime.

**Express:** Web framework for Node.js.

**Speakeasy:** Library for generating and verifying OTPs.

**Dotenv:** Module to load environment variables from a .env file.


