```css
Bellow is a list of all available commands.
```
```css
#create     

.giveaway create -> Creates a new giveaway. One user can have multiple.

parameters:
  timespan: when the giveaway will finish. Can be in seconds, minutrs, hours, or days. 
  winners: how many winners the giveaway will have.
  ammount: how much will be distributed among winners
  title: title of the giveaway

  .giveaway create <timespan> <winners> <ammount> <title>

Example: .giveaway create 1h 3w 100CCX Random Giveaway
```
```css
#list     

.giveaway list -> Lists all active giveaways.

Example: .giveaway list
```
```css
#delete     

.giveaway delete -> Deletes the specified giveaway

parameters:
  id: indentifier of the giveaway, that can be acquired with the "list" command.

  .giveaway delete <id>

Example: .giveaway delete 5
```