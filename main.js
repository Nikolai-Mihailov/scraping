const cheerio = require('cheerio');
const request = require('request');
let xl = require('excel4node');
let test = [];

function exel(companyName, address, email, phone, fax, contactPerson, website) {
    let wb = new xl.Workbook();
    let ws = wb.addWorksheet('Sheet 1');
    // / Create a reusable style
    var style = wb.createStyle({
        font: {
            color: '#000000',
            size: 12,
        }
    });
    ws.cell(1, 1)
        .string('Company')
        .style(style);
    ws.cell(1, 2)
        .string('Address')
        .style(style);
    ws.cell(1, 3)
        .string('Phone')
        .style(style);
    ws.cell(1, 4)
        .string('Fax')
        .style(style);
    ws.cell(1, 5)
        .string('Email')
        .style(style);
    ws.cell(1, 6)
        .string('Contact Person')
        .style(style);
    ws.cell(1, 7)
        .string('Website')
        .style(style);


    test.push(companyName);
    // console.log(test.length);
    for (let i = 0; i <= test.length; i += 1) {
        ws.cell(2, i, 3 + i, 1).string(test[i]);
    }
    ws.addDataValidation({
        allowBlank: true,
        sqref: 'A1: A1000' // Required. Specifies range of cells to apply validate. i.e. ""
    });
    wb.write('Excel.xlsx');

}

let scraping = () => {
    request('https://www.ok-power.de/fuer-strom-kunden/anbieter-uebersicht.html', (error, response, page) => {
        if (!error && response.statusCode == 200) {

            const $ = cheerio.load(page);
            // const mainClass = $('<div class="ce_table anbieter block>');
            $('tbody').each((i, element) => {
                let phone;
                let contactPerson;
                let website;
                let tbElements = $(element).text();
                // Create a new instance of a Workbook class

                // Searching for positions ****
                // Phone position
                let position = tbElements.toLowerCase().search('tel');
                // wWebsite
                let wbPosition = tbElements.toLowerCase().search('www');
                // Person position
                let contactPersonPosition = $(element).text().toLowerCase().search('ansprechpartner:');
                // Taking company name
                const companyName = $(element).find('.col_first').children().text();
                //  taking first and secont part of the address
                const firstPartOfTheAddress = $(element).find('.row_2').find('.col_first').text();
                const secondPartOfTheAddress = $(element).find('.row_3').find('.col_first').text();
                // Full adress
                const address = `${firstPartOfTheAddress} ${secondPartOfTheAddress}`;
                // Email
                const email = $(element).find('.email').text();
                // Fax
                let fax = $(element).find('.row_3').find('.col_last').text();
                if (!fax.toLowerCase().startsWith("fax")) {
                    fax = "";
                }

                //  Phone Numbers 
                if (position) {
                    phone = tbElements.slice(position, position + 100).replace(/^\D+/g, '').replace(/[\n\r]/g, '').trim();

                } else {
                    console.log("No phone numbers found");
                }

                //  Phone Numbers 
                if (contactPersonPosition) {

                    contactPerson = tbElements.slice(contactPersonPosition + 16, contactPersonPosition + 41).trim();

                } else {
                    console.log('No "Ansprechpartner" found');
                }

                if (wbPosition) {
                    website = tbElements.slice(wbPosition, wbPosition + 30).trim();
                } else {
                    console.log('No websites found');
                }


                let companyObject = {
                    companyName: companyName,
                    address: address,
                    email: email,
                    phone: phone,
                    fax: fax,
                    contactPerson: contactPerson,
                    website: website
                };
                exel(companyObject.companyName);
            });
        } else {
            console.log(error);
        }
    });
}

scraping();