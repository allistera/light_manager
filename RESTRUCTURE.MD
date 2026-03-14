The current light manager follows the wrong pholosphy.

## Data Structure

The Data Structuer should look like this:

* Light Groups -> (has many) Lights
* Light Groups -> (has one) Scene
* Scenes -> )optionally, has one Scene Library

## Structure 

There should be 3 tabs with the following dataL

### Groups

Mostly as it currently is - a list of groups with their lights assocated with it,

## Light Groups

The Light group tabs (renamed from scenes) should show a in card format a list of light groups with the ability to create/edit/delete one.

The look of each Light Group Cards should look like:

![light GROUP](./mockups/Light%20Group.png.jpg)

THE bar at the top should change the brightness of lights in the group, and the toggle should turn them on and off

Currently only one light group can be assigned to a light.

The + button should open a dialog with (CURRENTLY) options: Library Scene

when the user clicks next in the dialog it should list all library light groups, allowing to select one to assocate with that light group.

There should be a button to start, and stop scene to test.

## Light Library

The scene library should look like this;

![light GROUP](./mockups/Scene%20Library.png)

It should show a number of cards in a tile like layout with a number of pre-defined light scenes.

the save to my scene should list light groups to add it to.

The set once should list light groups, run it, but not save it.

There should also be two options in each light library;

* Transisition Times - how long it takes to go through each color 
* Repete idefinitly - checkbox to make the light group repeate indefinetly.