# Amazon QLDB Node.js DMV Sample App
[![license](https://img.shields.io/badge/license-MIT-green)](https://github.com/aws-samples/amazon-qldb-dmv-sample-nodejs/blob/master/LICENSE)
[![AWS Provider](https://img.shields.io/badge/provider-AWS-orange?logo=amazon-aws&color=ff9900)](https://aws.amazon.com/qldb/)

The samples in this project demonstrate several uses of Amazon Quantum Ledger Database (QLDB).

For our tutorial, see [Node.js and Amazon QLDB](https://docs.aws.amazon.com/qldb/latest/developerguide/getting-started.nodejs.html).

## Requirements

### Basic Configuration

See [Accessing Amazon QLDB](https://docs.aws.amazon.com/qldb/latest/developerguide/accessing.html) for information on connecting to AWS.

See [Setting Region](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-region.html) page for more information on using the AWS SDK for JavaScript. You will need to set a region before running the sample code.

### TypeScript 3.5.x

The sample code is written in, and requires, TypeScript 3.5.x. It will be automatically installed as a dependency. 
Please see the link below for more detail on TypeScript 3.5.x:

* [TypeScript 3.5.x](https://www.npmjs.com/package/typescript)

## Installing the Dependencies

Install Node.js QLDB driver, and other dependencies using the npm utility:

```
npm install
```

## Running the Sample Code

Since the sample code is written in TypeScript, it must first be transpiled in order to be run:

```
npm run build
```

The transpiled JavaScript files can be now found in the `./dist` directory.

The sample code creates a ledger with tables and indexes, and inserts some documents into those tables,
among other things. Each of the examples in this project can be run in the following way:

```
node dist/CreateLedger.js
```

The above example will create a ledger named: `vehicle-registration`. 
You may run other examples after creating a ledger.

See [Getting Started](https://docs.aws.amazon.com/qldb/latest/developerguide/getting-started.nodejs.html) to learn more about the sample app.

## Documentation 

TypeDoc is used for documentation. You can generate HTML locally with the following:

```
npm run doc
```

## Release Notes
### Release 1.0.0

* Modify the sample app to use Qldb Node.js Driver v1.0.0

### Release 1.0.0-rc.2

* Modify the sample app to use Qldb Node.js Driver v1.0.0-rc.2

### Release 1.0.0-rc.1

* Modify the sample app to use Qldb Node.js Driver v1.0.0-rc.1

### Release 0.1.0-preview

* Initial preview release of the QLDB Node.js Sample Application.

## License

This library is licensed under [the MIT-0 License](https://github.com/aws/mit-0).
