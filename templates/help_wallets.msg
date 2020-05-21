```css
Below is a list of all available commands.
```
```css
#register

.wallet register -> Registers a new wallet for the user. You need to specify a valid CCX address.

#parameters:
  #ccxAddress: A valid CCX address that you want to be associated with your Discord account.

  .wallet register <ccxAddress>

#Example:
  .wallet register ccx7BhbhNMUMTrb8AHMWstMfVgXArLXAKVwL9NtSRbWQGuS4DicwC6BQFysni2AaFKVYLGdeqMcUH96To2zvExNm1XFY1zCVus
```
```css
#update

.wallet update -> Updates the current user wallet with new CCX address.

#parameters:
  #ccxAddress: A valid CCX address that you want to be associated with your Discord account.

  .wallet update <ccxAddress>

#Example:
  .wallet update ccx7BhbhNMUMTrb8AHMWstMfVgXArLXAKVwL9NtSRbWQGuS4DicwC6BQFysni2AaFKVYLGdeqMcUH96To2zvExNm1XFY1zCVus
```
```css
#show

.wallet show -> Gives the current wallet details for the user to DM.

Example:
  .wallet show
```
```css
#deposit

.wallet deposit -> Give the user info about how to deposit to his/her wallet in a DM.

Example:
  .wallet deposit
```
```css
#withdraw

.wallet withdraw -> Allows you to withdraw your funds back to your wallet.

#parameters:
  #amount: Amount to witdraw from the bot back to your registered wallet.

  .wallet withdraw <amount>

Example:
  .wallet withdraw 50CCX
```
```css
#balance

.wallet balance -> Shows the current user wallet balance in a DM.

Example:
  .wallet balance
```
```css
#paymentid

.wallet paymentid -> Generates a paymentId. This is for general purposes only.

Example:
  .wallet paymentid
```
