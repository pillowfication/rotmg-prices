// First I need to get all the IDs of every item. RealmEye gives each item its
// own ID, and this is how it refers to each one.
async function getItems () {
  // I found all the item IDs at https://www.realmeye.com/s/dr/js/definition.js.
  // Note that this is a .js file
  const request = require('./request')
  const definitionJS = await request('https://www.realmeye.com/s/dr/js/definition.js')

  // This .js file is formatted as
  //   items={ ...stuff... };
  // By reformatting the string as
  //   ({ ...stuff... })
  // it can be execute with the eval() command. `definitionJSON` will contain
  // the result of this execution.
  const definitionJSON = eval('(' + definitionJS.slice('items='.length, -1) + ')')

  // Now `definitionJSON` is an object containining all the information I need.
  // the object looks like
  //   {
  //     3285: [ "Ivory Wyvern Key", 10, -1, 46, 0, 0, 100, null ],
  //     3284: [ "Draconis Key", 10, -1, 46, 0, 0, 200, null ],
  //     ...
  //   }
  // The keys of this object are the item IDs, and the values are arrays of
  // length 8. The 1st element of this array is always the item name. Nothing
  // else in this array matters. (The 2nd element refers to some category, 6th
  // and 7th elements refer to Fame/Feed power, others idk).
  // Here I reformat it into something more useful.
  const itemIds = []
  for (const key in definitionJSON) {
    if (key === '-1') continue // Skip the item with ID '-1'. It indicates and empty slot.

    itemIds.push({
      id: key,
      name: definitionJSON[key][0]
    })
  }

  // Done!
  return itemIds
}

module.exports = getItems
