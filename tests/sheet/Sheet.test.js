import test from 'tape'
import { insertRows, deleteRows, insertCols, deleteCols, setCell } from '../../src/sheet/sheetManipulations'
import createRawArchive from '../util/createRawArchive'
import createSheetXML from '../util/createSheetXML'
import loadRawArchive from '../util/loadRawArchive'
import StubEngine from '../util/StubEngine'
import setupEngine from '../util/setupEngine'
import { queryValues, play } from '../util/engineTestHelpers'


/*
  This test is using an archive with a sheet attached to the Engine
  making sure all Sheet interactions and manipulations are working.

  All tests are done on a model level, i.e. the UI is not tested.

  > TODO:
    - insert/delete rows/cols (effect on engine)
    - SheetClipboard
    - SheetCommands
    - sheetManipulations
*/

test('Sheet (model): inserting rows should increase row count', (t) => {
  let { sheetSession, sheet } = _setupModel(simple())
  insertRows(sheetSession, 1, 2)
  t.deepEqual(sheet.getRowCount(), 6, 'row count should have been updated')
  t.end()
})

test('Sheet (model): deleting rows should decrease row count', (t) => {
  let { sheetSession, sheet } = _setupModel(simple())
  deleteRows(sheetSession, 1, 2)
  t.deepEqual(sheet.getRowCount(), 2, 'row count should have been updated')
  t.end()
})

test('Sheet (model): inserting columns should increase column count', (t) => {
  let { sheetSession, sheet } = _setupModel(simple())
  insertCols(sheetSession, 1, 2)
  t.deepEqual(sheet.getColumnCount(), 5, 'row count should have been updated')
  t.end()
})

test('Sheet (model): deleting columns should decrease column count', (t) => {
  let { sheetSession, sheet } = _setupModel(simple())
  deleteCols(sheetSession, 1, 2)
  t.deepEqual(sheet.getColumnCount(), 1, 'row count should have been updated')
  t.end()
})

test('Sheet (engine): registration', (t) => {
  t.plan(2)
  let { engine } = _setupWithEngine(simple())
  t.ok(engine.hasResource('sheet'), 'sheet should have been registered')
  play(engine).then(() => {
    t.deepEqual(queryValues(engine, 'sheet!A1:C1'), [1, 2, 3], 'sheet values should be set')
  })
})

test('Sheet (engine): registration of a new sheet', (t) => {
  let { archive, engine } = _setupWithEngine(simple())
  let sheetXml = createSheetXML({
    cells: [
      ['1', '2'],
      ['3', '4'],
    ]
  })
  let sheetId = archive.addDocument('sheet', 'Sheet 2', sheetXml)
  t.ok(engine.hasResource(sheetId), 'new sheet should have been registered')
  t.end()
})

test('Sheet (engine): update a cell', (t) => {
  t.plan(1)
  let { engine, sheetSession } = _setupWithEngine(simple())
  setCell(sheetSession, 0, 1, '55')
  play(engine).then(() => {
    t.deepEqual(queryValues(engine, 'sheet!A1:C1'), [1, 55, 3], 'sheet value should have been updated')
  })
})

test('Sheet (engine): insert a row', (t) => {
  t.plan(2)
  let { engine, sheetSession } = _setupWithEngine(simple())
  setCell(sheetSession, 3, 0, '=sum(A1:A3)')
  play(engine).then(() => {
    t.equal(queryValues(engine, 'sheet!A4'), 12, 'sheet value should be correct')
  })
  .then(() => {
    insertRows(sheetSession, 1, 1)
    setCell(sheetSession, 1, 0, '3')
  })
  .then(() => play(engine))
  .then(() => {
    t.equal(queryValues(engine, 'sheet!A5'), 15, 'sheet value should have been updated')
  })
})

function simple() {
  return {
    id: 'sheet',
    path: 'sheet.xml',
    type: 'sheet',
    name: 'My Sheet',
    columns: [{ name: 'x' }, { name: 'y' }, { name: 'z' }],
    cells: [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['10', '11', '12']
    ]
  }
}

function _setupModel(sheetData) {
  let engine = new StubEngine()
  return _setup(sheetData, engine)
}

function _setupWithEngine(sheetData) {
  let { engine } = setupEngine()
  return _setup(sheetData, engine)
}

function _setup(sheetData, engine) {
  let context = { engine }
  let rawArchive = createRawArchive([ sheetData ])
  let archive = loadRawArchive(rawArchive, context)
  let sheetSession = archive.getEditorSession('sheet')
  let sheet = sheetSession.getDocument()
  return { archive, sheetSession, sheet, engine }
}