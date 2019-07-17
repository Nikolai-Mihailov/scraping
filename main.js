const cheerio = require('cheerio');
const request = require('request');
let xl = require('excel4node');
let companyInformation = [];


function getPersonData(companyCard, $) {
    let tbElements = $(companyCard).text();
    let companyObject = {
        companyName: '',
        address: '',
        email: '',
        phone: '',
        fax: '',
        contactPerson: '',
        website: ''
    };
    // Searching for positions ****

    // Phone position
    let position = tbElements.toLowerCase().search('tel.');
    // wWebsite
    let wbPosition = tbElements.toLowerCase().search('www');

    let contactPersonPosition = $(companyCard).text().toLowerCase().search('ansprechpartner:');
    // Taking company name
    companyObject.companyName = $(companyCard).find('.col_first').children().text();
    const firstPartOfTheAddress = $(companyCard).find('.row_2').find('.col_first').text();
    const secondPartOfTheAddress = $(companyCard).find('.row_3').find('.col_first').text();
    // Full adress
    companyObject.address = `${firstPartOfTheAddress} ${secondPartOfTheAddress}`;
    companyObject.email = $(companyCard).find('.email').text();
    // Fax
    companyObject.fax = $(companyCard).find('.row_3').find('.col_last').text();
    if (!companyObject.fax.toLowerCase().startsWith("fax")) {
        companyObject.fax = "";
    } else if (companyObject.fax.toLowerCase().startsWith("fax:") || companyObject.fax.toLowerCase().startsWith("fax.")) {
        companyObject.fax = companyObject.fax.substring(4);
    } else {
        companyObject.fax = companyObject.fax.substring(3);
    }
    //  Phone Numbers 
    if (position) {
        companyObject.phone = tbElements.slice(position, position + 32).replace(/^\D+/g, '' | /[\n\r]/g, '').trim();
        companyObject.phone = companyObject.phone.substring(1);

    } else {
        console.log("No phone numbers found");
    }
    //  Phone Numbers 
    if (contactPersonPosition) {
        companyObject.contactPerson = tbElements.slice(contactPersonPosition + 16, contactPersonPosition + 41).trim();
    } else {
        console.log('No "Ansprechpartner" found');
    }
    if (wbPosition) {
        companyObject.website = tbElements.slice(wbPosition, wbPosition + 30).trim();
    } else {
        console.log('No websites found');
    }
    return companyObject;
}

(function() {
    request('https://www.ok-power.de/fuer-strom-kunden/anbieter-uebersicht.html', (error, response, page) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(page);
            $('tbody').each((i, element) => {
                companyInformation.push(getPersonData(element, $));
            });

            let wb = new xl.Workbook();
            // Creating options and styles for exel document
            let options = {
                'sheetFormat': {
                    'baseColWidth': 30,
                },
            };
            let style = wb.createStyle({
                font: {
                    color: '#000000',
                    size: 12,
                }
            });
            let styleTwo = wb.createStyle({
                font: {
                    color: '#000000',
                    size: 20,
                },
                alignment: {
                    horizontal: 'center'
                }
            });
            let ws = wb.addWorksheet('Sheet 1', options);
            // Creating and pushing into cells
            ws.cell(1, 1)
                .string('Company')
                .style(styleTwo);
            ws.cell(1, 2)
                .string('Address')
                .style(styleTwo);
            ws.cell(1, 3)
                .string('Phone')
                .style(styleTwo);
            ws.cell(1, 4)
                .string('Fax')
                .style(styleTwo);
            ws.cell(1, 5)
                .string('Email')
                .style(styleTwo);
            ws.cell(1, 6)
                .string('Contact Person')
                .style(styleTwo);
            ws.cell(1, 7)
                .string('Website')
                .style(styleTwo);
            // Looping true all elements of getPersonData
            companyInformation.map((elements, index) => {
                ws.cell(index + 2, 1).string(elements.companyName)
                    .style(style);
                ws.cell(index + 2, 2).string(elements.address)
                    .style(style);
                ws.cell(index + 2, 3).string(elements.phone)
                    .style(style);
                ws.cell(index + 2, 4).string(elements.fax)
                    .style(style);
                ws.cell(index + 2, 5).string(elements.email)
                    .style(style);
                ws.cell(index + 2, 6).string(elements.contactPerson)
                    .style(style);
                ws.cell(index + 2, 7).string(elements.website)
                    .style(style);
            });
            wb.write('Excel.xlsx');
        } else {
            console.log(error);
        }
    });
})();