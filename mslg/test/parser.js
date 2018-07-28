/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var chai = require('chai');
var assert = chai.assert;
const parser = require('../lib/parser');
const path = require('path');
const readFile = require('read-text-file');
const retCode = require('../lib/enums/errorCodes');
const EntityTypes = require('../lib/enums/LGEntityType');
describe('The parser', function() {
            
    describe('For true negatives on variation text', function() {

        it('Throws when a variation has empty or null value', function(done) {
            let fileContent = `# Greeting
            - `;
            parser.parse(fileContent, false)
                .then(res => done ('test fail! did not throw when expected'))
                .catch(err => {assert.equal(err.errCode, retCode.INVALID_VARIATION);done();})
        });
    
        it('Throws when a variation has reference to an reserved word as entity name', function(done) {
            let fileContent = `# Greeting
            - test {Floor} `;
            parser.parse(fileContent, false)
                .then(res => done ('test fail! did not throw when expected'))
                .catch(err => {assert.equal(err.errCode, retCode.ENTITY_WITH_RESERVED_KEYWORD); done();})
        });

        it('Throws when a variation has at least one reference to an reserved word as entity name', function(done) {
            let fileContent = `# Greeting
            - test {userName} {Floor} `;
            parser.parse(fileContent, false)
                .then(res => done ('test fail! did not throw when expected'))
                .catch(err => {assert.equal(err.errCode, retCode.ENTITY_WITH_RESERVED_KEYWORD); done();})
        });
    
        it('Throws when a variation has reference to nested templates', function(done) {
            let fileContent = `# Greeting
            - test [foo[bar]]`;
            parser.parse(fileContent, false)
                .then(res => done ('test fail! did not throw when expected'))
                .catch(err => {assert.equal(err.errCode, retCode.NESTED_TEMPLATE_REFERENCE); done();})
        });
    
        it('Throws when a variation has reference to nested entity', function(done) {
            let fileContent = `# Greeting
            - test {foo{bar}}`;
            parser.parse(fileContent, false)
                .then(res => done ('test fail! did not throw when expected'))
                .catch(err => {assert.equal(err.errCode, retCode.NESTED_ENTITY_REFERENCE); done();})
        });

        it('Throws when call back function is not enclosed in {}', function(done) {
            let fileContent = `# Greeting
            - fooBar(userName)`;
            parser.parse(fileContent, false)
                .then(res => done ('test fail! did not throw when expected'))
                .catch(err => {assert.equal(err.errCode, retCode.INVALID_CALLBACK_FUNTION_DEF); done();})
        });

        it('Throws when call back function is not enclosed in {} with text in variation', function(done) {
            let fileContent = `# Greeting
            - hi fooBar(userName)`;
            parser.parse(fileContent, false)
                .then(res => done ('test fail! did not throw when expected'))
                .catch(err => {assert.equal(err.errCode, retCode.INVALID_CALLBACK_FUNTION_DEF); done();})
        });

        it('Throws when a variation has an unrecognized call back function name', function(done) {
            let fileContent = `# Greeting
            - {fooBar(userName)}`;
            parser.parse(fileContent, false)
                .then(res => done ('test fail! did not throw when expected'))
                .catch(err => {assert.equal(err.errCode, retCode.INVALID_CALLBACK_FUNTION_NAME); done();})
        });
        
        it('Throws when a variation has at least one invalid reference to a call back function and other valid text in it', function(done) {
            let fileContent = `# Greeting
            - hi you were born on {Month(birthDate)}, {fooBar(userName)}`;
            parser.parse(fileContent, false)
                .then(res => done ('test fail! did not throw when expected'))
                .catch(err => {assert.equal(err.errCode, retCode.INVALID_CALLBACK_FUNTION_NAME); done();})
        });

        it('Throws on invalid entity definition', function(done){
            let fileContent = `$userName string
            $datetime : dateTime`;
            parser.parse(fileContent, false)
                .then(res => done('Test fail! did not throw when expected'))
                .catch(err => {
                    assert.equal(err.errCode, retCode.INVALID_ENTITY_DEFINITION);
                    done(); 
                })
        });


    }); 
    
    describe('For true negatives on condition names for conditional responses ', function(){

    });

    describe('For true negatives on template names', function() {
        it('Throws when no template name is specified', function(done) {
            let fileContent = `# 
            - hi`;
            parser.parse(fileContent, false)
                .then(res => done('Test fail! did not throw when expected'))
                .catch(err => {
                    assert.equal(err.errCode, retCode.INVALID_TEMPLATE);
                    done();
                })
        });

        it('Throws when template name has spaces in it', function(done) {
            let fileContent = `# Greeting template
            - hi`;
            parser.parse(fileContent, false)
                .then(res => done('Test fail! did not throw when expected'))
                .catch(err => {
                    assert.equal(err.errCode, retCode.INVALID_SPACE_IN_TEMPLATE_NAME);
                    done();
                })
        });
    });

    describe('Basic parsing', function() {
        
        it('Correctly parses a document with just comments', function(done) {
            let fileContent = `> this is a comment`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.equal(res.LGObject, undefined);
                    done ();
                })
                .catch(err => done(err))
        });

        it('Correctly parses a document with one template definition', function(done) {
            let fileContent = `# Greeting
            - test`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.equal(res.LGObject.LGTemplates[0].name, 'Greeting');
                    assert.deepEqual(res.LGObject.LGTemplates[0].variations, ['test']);
                    done ();
                })
                .catch(err => done(err))
        });

        it('Correctly parses a document with two template definitions', function(done) {
            let fileContent = `# Greeting
            - test
            
            # wPhrase
            - hi`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.equal(res.LGObject.LGTemplates.length, 2);
                    assert.deepEqual(res.LGObject.LGTemplates[1].variations, ['hi']);
                    done ();
                })
                .catch(err => done(err))
        });

        it('Correctly parses a document with a conditional response definition', function(done) {
            let fileContent = `# Greeting
            - CASE: foo
                - hi`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.equal(res.LGObject.LGTemplates[0].name, 'Greeting');
                    assert.equal(res.LGObject.LGTemplates[0].conditionalResponses[0].condition, 'foo');
                    assert.deepEqual(res.LGObject.LGTemplates[0].conditionalResponses[0].variations, ['hi']);
                    done ();
                })
                .catch(err => done(err))
        });

        it('Correctly parses a document with multiple conditional response definition', function(done) {
            let fileContent = `# Greeting
            - CASE: foo
                - hi
            - DEFAULT:
                - test`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.equal(res.LGObject.LGTemplates[0].name, 'Greeting');
                    assert.equal(res.LGObject.LGTemplates[0].conditionalResponses[1].condition, 'Else');
                    assert.deepEqual(res.LGObject.LGTemplates[0].conditionalResponses[1].variations, ['test']);
                    done ();
                })
                .catch(err => done(err))
        });

        it('Correctly collates multiple template definitions into one list', function(done) {
            let fileContent = `# Greeting
            - hi

            # Greeting
            - test`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.equal(res.LGObject.LGTemplates[0].name, 'Greeting');
                    assert.equal(res.LGObject.LGTemplates[0].variations.length, 2);
                    done ();
                })
                .catch(err => done(err))
        });

        it('Correctly collates multiple template definitions with disjoint conditions into one list', function(done) {
            let fileContent = `# Greeting
            - CASE: foo
                - hi
            - DEFAULT:
                - test
                
            # Greeting
            - CASE: foo
                - hello
            - CASE: bar
                - hi
            - DEFAULT:
                - test2`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.equal(res.LGObject.LGTemplates[0].name, 'Greeting');
                    assert.equal(res.LGObject.LGTemplates[0].conditionalResponses.length, 3);
                    assert.equal(res.LGObject.LGTemplates[0].conditionalResponses[1].condition, 'Else');
                    done ();
                })
                .catch(err => done(err))
        });

        it('Correctly parses file references in LG file', function(done) {
            let fileContent = `# Greeting
            - CASE: foo
                - hi
            - DEFAULT:
                - test
                
            [reference](./1.lg)`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.equal(res.additionalFilesToParse.length, 1);
                    done ();
                })
                .catch(err => done(err))
        });

        it('Correctly strips out link references to templates in variation text', function(done) {
            let fileContent = `# Greeting
            - CASE: foo
                - hi [bar](./1.lg#bar)
            - DEFAULT:
                - test
                
            [reference](./1.lg)`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.deepEqual(res.LGObject.LGTemplates[0].conditionalResponses[0].variations, ['hi [bar]']);
                    done ();
                })
                .catch(err => done(err))
        });
        it('Correctly strips out multiple link references to templates in variation text', function(done) {
            let fileContent = `# Greeting
            - CASE: foo
                - hi [bar](./1.lg#bar) low [bar](./1.lg#bar)
            - DEFAULT:
                - test
                
            [reference](./1.lg)`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.deepEqual(res.LGObject.LGTemplates[0].conditionalResponses[0].variations, ['hi [bar] low [bar]']);
                    done ();
                })
                .catch(err => done(err))
        });

        it('Correctly strips out link references to templates in variation text', function(done) {
            let fileContent = `# Greeting
            - hi [bar](./1.lg#bar)`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.deepEqual(res.LGObject.LGTemplates[0].variations[0], 'hi [bar]');
                    done ();
                })
                .catch(err => done(err))
        });

        it('Correctly strips out multiple link references to templates in variation text', function(done) {
            let fileContent = `# Greeting
            - hi [bar](./1.lg#bar) low [bar](./1.lg#bar)`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.deepEqual(res.LGObject.LGTemplates[0].variations[0], 'hi [bar] low [bar]');
                    done ();
                })
                .catch(err => done(err))
        });

        it('Correctly parses entity definitions in LG files', function(done){
            let fileContent = `$userName: string`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.equal(res.LGObject.entities[0].name, 'userName');
                    assert.equal(res.LGObject.entities[0].entityType, EntityTypes.String.name);
                    done();
                })
                .catch(err => done(err))
        });

        it('Correctly parses multiple entity definitions in LG files', function(done){
            let fileContent = `$userName: string
            $datetime : dateTime`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.equal(res.LGObject.entities.length, 2);
                    assert.equal(res.LGObject.entities[1].entityType, EntityTypes.DateTime.name);
                    done();
                })
                .catch(err => done(err))
        });

        it('Correctly falls back to String type on invalid entity type declaration', function(done){
            let fileContent = `$userName : foobar
            $datetime : dateTime`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.equal(res.LGObject.entities[0].entityType, EntityTypes.String.name)
                    assert.equal(res.LGObject.entities[1].entityType, EntityTypes.DateTime.name)
                    done();
                })
                .catch(err => done(err))
        });

        it('Correctly collates entities across multiple files', async function(){
            let f1 = `# Greeting
            - hi {userName}`;
            let f2 = `$dateOfBirth : datetime`;
            let f1p, f2p, c;
            try {
                f1p = await parser.parse(f1, false);
                f2p = await parser.parse(f2, false);
                c = await parser.collate([f1p.LGObject, f2p.LGObject]);
                assert.equal(c.entities.length, 2);
                assert.equal(c.entities[1].name, 'dateOfBirth');
            } catch (err) {
                throw(err);
            }
            
        });

        it('Throws when conflicting entity definitions are found when collating', async function(){
            let f1 = `# Greeting
            - hi {userName}`;
            let f2 = `$userName : datetime`;
            let f1p, f2p, c;
            try {
                f1p = await parser.parse(f1, false);
                f2p = await parser.parse(f2, false);
                c = await parser.collate([f1p.LGObject, f2p.LGObject]);
                throw ('Test fail! did not throw when expected');
            } catch (err) {
                if(!err.errCode) throw (err);
                assert.equal(err.errCode, retCode.DUPLICATE_INCOMPATIBE_ENTITY_DEF);
            }
            
        });

        it('Correctly parses entity definitions with attribution in LG files', function(done){
            let fileContent = `$address: string say-as = Address`;
            parser.parse(fileContent, false)
                .then(res => {
                    assert.equal(res.LGObject.entities[0].name, 'address');
                    assert.equal(res.LGObject.entities[0].entityType, EntityTypes.String.name);
                    assert.equal(res.LGObject.entities[0].attributions.length, 1);
                    assert.deepEqual(res.LGObject.entities[0].attributions[0], {'key': 'say-as', 'value': 'Address'});
                    done();
                })
                .catch(err => done(err))
        });

        it('Correctly collates file content when multiple LG files are parsed', function(done) {
            let inputFolder = path.resolve('./examples');
            let outputFolder = path.resolve('./test/output');
            parser.parseCollateAndWriteOut(inputFolder, false, outputFolder, 'collate', false)
                .then(res => {
                    assert.equal(readFile.readSync('./test/verified/collate.lg'), readFile.readSync('./test/output/collate.lg'));
                    done();
                })
                .catch(err => done(err))
        });

    
    });
});