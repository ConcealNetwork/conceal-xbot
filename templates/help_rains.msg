```css
List of all available commands.
```
```css
#recent

Rains upon recent active users.

#parameters:
  #amount: amount distributed among users.
  #users: how many user we want to rain upon.

  .rain recent <amount> <users>

#Ex:
  .rain recent 10CCX 50u
```
```css
#alltime

Rains upon the all time most active users.

#parameters:
  #amount: amount distributed among users.
  #users: how many user we want to rain upon.

  .rain alltime <amount> <users>

#Ex:
  .rain alltime 10CCX 50u
```
```css
#period

Rains upon users most active in the last period.

#parameters:
  #amount: amount distributed among users.
  #users: how many user we want to rain upon.

  .rain period <amount> <users>

#Ex:
  .rain period 10CCX 50u
```
```css
#random

Rains upon random n users.

#parameters:
  #amount: amount distributed among users.
  #n: how many user we want to rain upon.

  .rain random <amount> <n>

#Ex:
  .rain random 10CCX 50u
```
```css
#channel

Rains upon the users of specified channel.

#parameters:
  #amount: amount distributed among users.
  #channel: the channel users you want to rain upon.
  #users: users we want to rain upon (if ommited it will rain upon all users up to 100max random).

  .rain channel <amount> <channel> <users>

#Ex:
  .rain channel 10CCX #general 50u
```
```css
#role

Rains upon the users of specified role.

#parameters:
  #amount: amount distributed among users.
  #role: the role users you want to rain upon.
  #users: users we want to rain upon (if ommited it will rain upon all users up to 100max random).

  .rain role <amount> <role> <users>

#Ex:
  .rain role 10CCX @crew 50u
```
```css
#reset

Resets the period counters. Admins feature.

#Ex:
  .rain reset
```
```css
#beer

Rains some beer for hot days.

#Ex:
  .rain beer
```
