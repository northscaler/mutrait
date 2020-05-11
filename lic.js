#!/usr/bin/env node

const fs = require('fs')
const _ = { template: require('lodash.template') }

const tmpl = _.template(fs.readFileSync(`${__dirname}/LICENSE.tmpl`))
const lic = tmpl({ YEAR: new Date().getFullYear(), HOLDER: 'Northscaler, Inc.' })

process.stdout.write(lic)
