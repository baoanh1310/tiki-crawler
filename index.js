const puppeteer = require('puppeteer')
const fs = require('fs')
require('dotenv').config()

async function getImageSources(url) {
	const browser = await puppeteer.launch({ headless: true, timeout: 0 })
	const page = await browser.newPage()
	await page.goto(url, { timeout: 0 })

	let result = await page.evaluate(() => {
		let imgs = document.getElementsByTagName("img")
		imgs = [...imgs]
		let img_uri_list = imgs.map(img => img['src'])

		return img_uri_list
	})

	await browser.close()
	return result
}

async function getImagesMultiplePages(url) {
	console.log("Crawling page 1")
	let imgs = await getImageSources(url)
	for (let i = 2; i < 15; i++) {
		try {
			console.log("Crawling page ".concat(i.toString()))
			let newUrl = url.concat("&page=").concat(i.toString())
			let new_imgs = await getImageSources(newUrl)
			for (let img of new_imgs) {
				imgs.push(img)
			}
		} catch (err) {
			break
		}
	}
	return imgs
}

async function app(key) {
	let key_arr = key.split(' ')
	let search_key = key
	if (key_arr.length > 1) {
		search_key = key_arr.join("+")
	}
	console.log("Searching for: ".concat(key))
	let raw_imgs = await getImagesMultiplePages(`https://tiki.vn/search?q=${search_key}`)
	let setImgs = new Set(raw_imgs)
	let imgs = [...setImgs]

	let folder_path = 'txt_results'
	if (!fs.existsSync(folder_path)){
        fs.mkdirSync(folder_path)
    }

    let target_filename = key_arr.join("_")

	let file = fs.createWriteStream(`./txt_results/${target_filename}.txt`)
	file.on('error', (err) => { console.log(err) })
	imgs.forEach((url) => { file.write(url + '\n') })
	file.end()
}

const ITEM = process.env.ITEM
app(ITEM)
