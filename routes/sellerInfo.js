const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const jsdom = require('jsdom')
const { body, validationResult } = require('express-validator');

router.post(
    '/seller-info',
    // seller id is required
    body('seller_id').notEmpty().withMessage('please provide seller id'),
    // channel_url is required
    body('channel_url').notEmpty().withMessage('please provide amazon channel url'),
    function (req, res, next) {
        // validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const sellerId = req.body.seller_id;
        const channelUrl = req.body.channel_url;
        const link = `https://${channelUrl}/sp?seller=${sellerId}`;

        fetch(link).then(function (response) {
            if (response.ok) {
                return response.text();
            } else if (response.status === 503) {
                throw new Error('🙄 Too many requests. Amazon blocked seller page. Please try again in a few minutes.');
            } else {
                throw new Error(response.status);
            }
        }).then(function (html) {
            let seller = getSellerDetailsFromSellerPage(parse(html));
            res.status(200).send({seller_id: sellerId, seller_info: seller, error: null})
        }).catch(function (err) {
            res.status(500).send({seller_id: sellerId, seller_info: null, error: err})
        });
})

const getSellerCountryFromSellerPage = (sellerPage, isRedesign) => {
    let country;
    if (isRedesign) {
        country = sellerPage.window.document.querySelector('#page-section-detail-seller-info .a-box-inner .a-row:last-of-type span')?.textContent.toUpperCase();
    } else {
        try {
            const sellerUl = sellerPage.window.document.querySelectorAll('ul.a-unordered-list.a-nostyle.a-vertical'); //get all ul
            const sellerUlLast = sellerUl[sellerUl.length - 1]; //get last list
            const sellerLi = sellerUlLast.querySelectorAll('li'); //get all li
            const sellerLiLast = sellerLi[sellerLi.length - 1]; //get last li
            country = sellerLiLast.textContent.toUpperCase();
        } catch {
            return '?';
        }
    }
    return (/^[A-Z]{2}$/.test(country)) ? country : '?';
}

const getSellerStateFromSellerPage = (sellerPage, isRedesign) => {
    let state;
    if (isRedesign) {
        state = sellerPage.window.document.querySelector('#page-section-detail-seller-info .a-box-inner .a-row:nth-of-type(6) span')?.textContent.toUpperCase();
    } else {
        try {
            const sellerUl = sellerPage.window.document.querySelectorAll('ul.a-unordered-list.a-nostyle.a-vertical'); //get all ul
            const sellerUlLast = sellerUl[sellerUl.length - 3]; //get last list
            console.log(sellerUlLast)
            const sellerLi = sellerUlLast.querySelectorAll('li'); //get all li
            const sellerLiLast = sellerLi[sellerLi.length - 3]; //get last li
            state = sellerLiLast.textContent.toUpperCase();
        } catch {
            return '?';
        }
    }
    return state
}

const getSellerBusinessNameFromSellerPage = (sellerPage, isRedesign) => {
    let businessName;
    if (isRedesign) {
        businessName = sellerPage.window.document.querySelector('#page-section-detail-seller-info .a-box-inner .a-row:nth-of-type(2) span:last-of-type')?.textContent.toUpperCase();
    } else {
        try {
            const sellerUl = sellerPage.window.document.querySelectorAll('ul.a-unordered-list.a-nostyle.a-vertical'); //get all ul
            const sellerUlLast = sellerUl[sellerUl.length - 7]; //get last list
            const sellerLi = sellerUlLast.querySelectorAll('li'); //get all li
            const sellerLiLast = sellerLi[sellerLi.length - 7]; //get last li
            businessName = sellerLiLast.textContent.toUpperCase();
        } catch {
            return '?';
        }
    }
    return businessName
}

const getSellerStoreFrontNameFromSellerPage = (sellerPage, isRedesign) => {
    let storeFrontName;
    if (isRedesign) {
        storeFrontName = sellerPage.window.document.querySelector('#page-section-seller-header .a-box-inner .a-row > h1')?.textContent.toUpperCase();
    } else {
        try {
            const sellerUl = sellerPage.window.document.querySelectorAll('ul.a-unordered-list.a-nostyle.a-vertical'); //get all ul
            const sellerUlLast = sellerUl[sellerUl.length - 7]; //get last list
            const sellerLi = sellerUlLast.querySelectorAll('li'); //get all li
            const sellerLiLast = sellerLi[sellerLi.length - 7]; //get last li
            storeFrontName = sellerLiLast.textContent.toUpperCase();
        } catch {
            return '?';
        }
    }
    return storeFrontName
}

const getSellerZipCodeFromSellerPage = (sellerPage, isRedesign) => {
    let zipCode;
    if (isRedesign) {
        zipCode = sellerPage.window.document.querySelector('#page-section-detail-seller-info .a-box-inner .a-row:nth-of-type(7) span')?.textContent.toUpperCase();
    } else {
        try {
            const sellerUl = sellerPage.window.document.querySelectorAll('ul.a-unordered-list.a-nostyle.a-vertical'); //get all ul
            const sellerUlLast = sellerUl[sellerUl.length - 2]; //get last list
            console.log(sellerUlLast)
            const sellerLi = sellerUlLast.querySelectorAll('li'); //get all li
            const sellerLiLast = sellerLi[sellerLi.length - 2]; //get last li
            zipCode = sellerLiLast.textContent.toUpperCase();
        } catch {
            return '?';
        }
    }
    return zipCode
}

const getSellerRatingFromSellerPage = (sellerPage, isRedesign) => {
    let idSuffix = isRedesign ? '-rd' : '';
    if (sellerPage.window.document.getElementById('sellerName' + idSuffix).textContent.includes('Amazon')) {
        return false; // seller is Amazon subsidiary and doesn't display ratings
    }

    let text = sellerPage.window.document.getElementById('seller-feedback-summary' + idSuffix).textContent;
    let regex = /(\d+%).*?\((\d+)/;
    let zeroPercent = '0%';

    // Turkish places the percentage sign in front (e.g. %89)
    if (sellerPage.window.document.documentElement.lang === 'tr-tr') {
        regex = /(%\d+).*?\((\d+)/;
        zeroPercent = '%0';
    }

    let rating = text.match(regex);
    let score = rating ? rating[1] : zeroPercent;
    let count = rating ? rating[2] : '0';

    return { score, count };
}

const getSellerDetailsFromSellerPage = (sellerPage) => {
    // Detect Amazon's 2022-04-20 redesign
    const sellerProfileContainer = sellerPage.window.document.getElementById('seller-profile-container');
    const isRedesign = sellerProfileContainer.classList.contains('spp-redesigned');

    const country = getSellerCountryFromSellerPage(sellerPage, isRedesign); // returns TR
    const state = getSellerStateFromSellerPage(sellerPage, isRedesign); // returns Istanbul
    const zip = getSellerZipCodeFromSellerPage(sellerPage, isRedesign); // returns 367233
    const businessName = getSellerBusinessNameFromSellerPage(sellerPage, isRedesign); // returns 367233
    const storeFrontName = getSellerStoreFrontNameFromSellerPage(sellerPage, isRedesign); // returns 367233
    const rating = getSellerRatingFromSellerPage(sellerPage, isRedesign); // returns 91%

    return { storeFrontName, businessName, country, state, zip, rating };
}

const parse = (html) => {
    return new jsdom.JSDOM(html);
}

module.exports = router;