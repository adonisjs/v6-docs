# Verifying user credentials

In an AdonisJS application, verifying user credentials is decoupled from the authentication layer. This ensures you can continue using the auth guards without limiting the options to verify the user credentials.

By default, we provide secure APIs to find users and verify their passwords. However, you can also implement additional ways to verify a user, like sending an OTP to their phone number or using 2FA.

In this guide, we will cover the process of finding a user by a UID and verifying their password before marking them as logged in.
