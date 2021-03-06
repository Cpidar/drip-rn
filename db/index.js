import RxDB from 'rxdb'
import { LocalDate, ChronoUnit } from 'js-joda'
import nodejs from 'nodejs-mobile-react-native'
import fs from 'react-native-fs'
import restart from 'react-native-restart'
import schemas from './schemas'
import cycleModule from '../lib/cycle'

let isMensesStart
let getMensesDaysRightAfter

const db = await RxDB.create({
  name: 'cycledb',
  adapter: 'idb',
  password: '',
  multiInstance: true,
  queryChangeDetection: false
})

const cycle = cycleModule()
isMensesStart = cycle.isMensesStart
getMensesDaysRightAfter = cycle.getMensesDaysRightAfter

export function getBleedingDaysSortedByDate() {
  return db.objects('CycleDay').filtered('bleeding != null').sorted('date', true)
}
export function getTemperatureDaysSortedByDate() {
  return db.objects('CycleDay').filtered('temperature != null').sorted('date', true)
}
export function getCycleDaysSortedByDate() {
  return db.objects('CycleDay').sorted('date', true)
}

export function getCycleStartsSortedByDate() {
  return db.objects('CycleDay').filtered('isCycleStart = true').sorted('date', true)
}
export function saveSymptom(symptom, date, val) {
  let cycleDay = getCycleDay(date)
  if (!cycleDay) cycleDay = createCycleDay(date)

  db.write(() => {
    if (bleedingValueDeleted(symptom, val)) {
      cycleDay.bleeding = val
      cycleDay.isCycleStart = false
      maybeSetNewCycleStart(cycleDay, val)
    } else if (bleedingValueAddedOrChanged(symptom, val)) {
      cycleDay.bleeding = val
      cycleDay.isCycleStart = isMensesStart(cycleDay)
      maybeClearOldCycleStarts(cycleDay)
    } else {
      cycleDay[symptom] = val
    }
  })

  function bleedingValueDeleted(symptom, val) {
    return symptom === 'bleeding' && !val
  }

  function bleedingValueAddedOrChanged(symptom, val) {
    return symptom === 'bleeding' && val
  }

  function maybeSetNewCycleStart(dayWithDeletedBleeding) {
    // if a bleeding value is deleted, we need to check if
    // there are any following bleeding days and if the
    // next one of them is now a cycle start
    const mensesDaysAfter = getMensesDaysRightAfter(dayWithDeletedBleeding)
    if (!mensesDaysAfter.length) return
    const nextOne = mensesDaysAfter[mensesDaysAfter.length - 1]
    if (isMensesStart(nextOne)) {
      nextOne.isCycleStart = true
    }
  }

  function maybeClearOldCycleStarts(cycleDay) {
    // if we have a new bleeding day, we need to clear the
    // menses start marker from all following days of this
    // menses that may have been marked as start before
    const mensesDaysAfter = getMensesDaysRightAfter(cycleDay)
    mensesDaysAfter.forEach(day => day.isCycleStart = false)
  }
}

export function updateCycleStartsForAllCycleDays() {
  db.write(() => {
    getBleedingDaysSortedByDate().forEach(day => {
      if (isMensesStart(day)) {
        day.isCycleStart = true
      }
    })
  })
}

export function createCycleDay(dateString) {
  let result
  db.write(() => {
    result = db.create('CycleDay', {
      date: dateString,
      isCycleStart: false
    })
  })
  return result
}

export function getCycleDay(dateString) {
  return db.objectForPrimaryKey('CycleDay', dateString)
}

export function getPreviousTemperature(date) {
  const targetDate = LocalDate.parse(date)
  const winner = getTemperatureDaysSortedByDate().find(candidate => {
    return LocalDate.parse(candidate.date).isBefore(targetDate)
  })
  if (!winner) return null
  return winner.temperature.value
}

function tryToCreateCycleDayFromImport(day, i) {
  try {
    // we cannot know this yet, gets detected afterwards
    day.isCycleStart = false
    db.create('CycleDay', day)
  } catch (err) {
    const msg = `Line ${i + 1}(${day.date}): ${err.message}`
    throw new Error(msg)
  }
}

export function getAmountOfCycleDays() {
  const cycleDaysSortedByDate = getCycleDaysSortedByDate()
  const amountOfCycleDays = cycleDaysSortedByDate.length
  if (!amountOfCycleDays) return 0
  const earliest = cycleDaysSortedByDate[amountOfCycleDays - 1]
  const today = LocalDate.now()
  const earliestAsLocalDate = LocalDate.parse(earliest.date)
  return earliestAsLocalDate.until(today, ChronoUnit.DAYS)
}

export function getSchema() {
  return db.schema.reduce((acc, curr) => {
    acc[curr.name] = curr.properties
    return acc
  }, {})
}

export function tryToImportWithDelete(cycleDays) {
  db.write(() => {
    db.delete(db.objects('CycleDay'))
    cycleDays.forEach(tryToCreateCycleDayFromImport)
  })
}

export function tryToImportWithoutDelete(cycleDays) {
  db.write(() => {
    cycleDays.forEach((day, i) => {
      const existing = getCycleDay(day.date)
      if (existing) db.delete(existing)
      tryToCreateCycleDayFromImport(day, i)
    })
  })
}

export function requestHash(type, pw) {
  nodejs.channel.post('request-SHA512', JSON.stringify({
    type: type,
    message: pw
  }))
}

export async function changeEncryptionAndRestartApp(hash) {
  let key
  if (hash) key = hashToInt8Array(hash)
  const defaultPath = db.path
  const dir = db.path.split('/')
  dir.pop()
  dir.push('copied.realm')
  const copyPath = dir.join('/')
  const exists = await fs.exists(copyPath)
  if (exists) await fs.unlink(copyPath)
  // for some reason, realm complains if we give it a key with value undefined
  if (key) {
    db.writeCopyTo(copyPath, key)
  } else {
    db.writeCopyTo(copyPath)
  }
  db.close()
  await fs.unlink(defaultPath)
  await fs.moveFile(copyPath, defaultPath)
  restart.Restart()
}

export function isDbEmpty () {
  return db.empty
}

export async function deleteDbAndOpenNew() {
  const exists = await fs.exists(Realm.defaultPath)
  if (exists) await fs.unlink(Realm.defaultPath)
  await openDb()
}

export function clearDb() {
  db.write(db.deleteAll)
}

function hashToInt8Array(hash) {
  const key = new Uint8Array(64)
  for (let i = 0; i < key.length; i++) {
    const twoDigitHex = hash.slice(i * 2, i * 2 + 2)
    key[i] = parseInt(twoDigitHex, 16)
  }
  return key
}
