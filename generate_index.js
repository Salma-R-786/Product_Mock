
const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = path.join(__dirname, 'products');
const INDEX_FILE = path.join(PRODUCTS_DIR, 'index.json');

function generateIndex() {
    console.log('Scanning products directory...');

    if (!fs.existsSync(PRODUCTS_DIR)) {
        console.error(`Products directory not found: ${PRODUCTS_DIR}`);
        return;
    }

    const items = fs.readdirSync(PRODUCTS_DIR, { withFileTypes: true });
    const products = [];

    for (const item of items) {
        if (item.isDirectory() && item.name.startsWith('prod')) {
            const productDir = path.join(PRODUCTS_DIR, item.name);
            const productFile = path.join(productDir, 'product.json');

            if (fs.existsSync(productFile)) {
                try {
                    const productData = JSON.parse(fs.readFileSync(productFile, 'utf8'));

                    // Extract fields based on user requirement and file structure
                    const productInfo = productData.product_info || {};
                    const variantSetup = productData.variant_setup || {};
                    const mediaGroups = productData.media_groups || {};

                    // Get thumbnail (try default media group first)
                    let thumbnail = "";
                    if (mediaGroups.default && mediaGroups.default.images && mediaGroups.default.images.length > 0) {
                        thumbnail = mediaGroups.default.images[0].url;
                    } else {
                        // Fallback to any other media group if default is empty
                        const keys = Object.keys(mediaGroups);
                        if (keys.length > 0 && mediaGroups[keys[0]].images && mediaGroups[keys[0]].images.length > 0) {
                            thumbnail = mediaGroups[keys[0]].images[0].url;
                        }
                    }

                    const productEntry = {
                        product_id: productData.product_id || item.name,
                        name: productInfo.name || "Unknown",
                        status: productInfo.status || "draft",
                        category: productInfo.category || "",
                        subcategory: productInfo.subcategory || "",
                        collections: productInfo.collections || [],
                        has_variants: variantSetup.has_variants || false,
                        base_price: productInfo.base_price || 0,
                        compare_at_price: productInfo.compare_at_price || 0,
                        thumbnail: thumbnail,
                        path: `products/${item.name}/product.json`
                    };

                    products.push(productEntry);
                } catch (err) {
                    console.error(`Error reading/parsing ${productFile}:`, err.message);
                }
            }
        }
    }

    const output = {
        version: 1,
        products: products,
        generated_at: new Date().toISOString()
    };

    fs.writeFileSync(INDEX_FILE, JSON.stringify(output, null, 2));
    console.log(`Successfully generated index with ${products.length} products at ${INDEX_FILE}`);
}

generateIndex();
