```css
Below is a list of all available commands.
```
```css
#recent

.rain recent -> Rains upon the users that were active recently.

#parameters:
  #amount: how much will be distributed among users.
  #users: how many user we want to rain upon.

  .rain recent <amount> <users>

#Example:
  .rain recent 10CCX 50u
```
```css
#alltime

.rain alltime -> Rains upon the all time most active users.

#parameters:
  #amount: how much will be distributed among users.
  #users: how many user we want to rain upon.

  .rain alltime <amount> <users>

#Example:
  .rain alltime 10CCX 50u
```
```css
#period

.rain period -> Rains upon the users that are most active in the last period.

#parameters:
  #amount: how much will be distributed among users.
  #users: how many user we want to rain upon.

  .rain period <amount> <users>

#Example:
  .rain period 10CCX 50u
```
```css
#random

.rain random -> Rains upon the selected number of random users.

#parameters:
  #amount: how much will be distributed among users.
  #users: how many user we want to rain upon.

  .rain random <amount> <users>

#Example:
  .rain random 10CCX 50u
```
```css
#channel

.rain channel -> Rains upon the users of specified channel.

#parameters:
  #amount: how much will be distributed among users.
  #channel: the channel users you want to rain upon.
  #users: may users we want to rain upon (if ommited it raind either upon all users or 100 max selected at random).

  .rain channel <amount> <channel> <users>

#Example:
  .rain channel 10CCX #general 50u
```
```css
#role

.rain role -> Rains upon the users of specified role.

#parameters:
  #amount: how much will be distributed among users.
  #role: the role users you want to rain upon.
  #users: may users we want to rain upon (if ommited it raind either upon all users or 100 max selected at random).

  .rain role <amount> <role> <users>

#Example:
  .rain role 10CCX @crew 50u
```
```css
#reset

.rain reset -> Resets the period counters. Only admins can do it.

#Example:
  .rain reset
```
```css
#beer

.rain beer -> Rains some beer for hot days.

#Example:
  .rain beer
```

