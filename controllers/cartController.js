import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export const addToCart = async (req, res) => {
    try {
        const { productSlug, quantity = 1 } = req.body;
        const userSlug = req.user.slug; 

        const product = await Product.findOne({ slug: productSlug });
        if (!product) {
            return res.status(404).json({ status: "error", message: "Product not found" });
        }

        let cart = await Cart.findOne({ user: userSlug });

        if (!cart) {
            cart = await Cart.create({
                user: userSlug,
                items: [{ productSlug, price: product.price, quantity }],
                totalPrice: product.price * quantity,
                totalItems: quantity
            });
        } else {
            const itemIndex = cart.items.findIndex(item => item.productSlug === productSlug);

            if (itemIndex > -1) {
                if (cart.items[itemIndex].quantity + quantity > product.stock) {
                    return res.status(400).json({ status: "error", message: "Product out of stock" });
                }
                cart.items[itemIndex].quantity += quantity;
                cart.items[itemIndex].price = product.price; 
                cart.totalPrice += (product.price * quantity);
                cart.totalItems += quantity;
            } else {
                if (quantity > product.stock) {
                    return res.status(400).json({ status: "error", message: "Product out of stock" });
                }
                cart.items.push({ productSlug, price: product.price, quantity });
                cart.totalPrice += (product.price * quantity);
                cart.totalItems += quantity;
            }

            await cart.save();
        }

        const slugsInCart = cart.items.map(item => item.productSlug);
        const productsInCart = await Product.find({ slug: { $in: slugsInCart } });

        const mappedItems = cart.items.map((item) => {
            const matchingProduct = productsInCart.find(p => p.slug === item.productSlug);
            
            return {
                images: matchingProduct ? matchingProduct.images : [],
                name: matchingProduct ? matchingProduct.name : "Unknown Product",
                price: item.price,
                quantity: item.quantity,
                slug: item.productSlug
            };
        });

        return res.status(200).json({ 
            status: "success", 
            cart: {
                items: mappedItems, 
                totalPrice: cart.totalPrice, 
                totalItems: cart.totalItems
            } 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
};

export const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.slug }).lean();
        
        if (!cart) {
            return res.status(200).json({ status: "success", cart: { items: [] } });
        }

        const slugsInCart = cart.items.map(item => item.productSlug);

        const productsInCart = await Product.find({ slug: { $in: slugsInCart } })
            .select("name images slug")
            .lean();

         const mappedItems = cart.items.map((item) => {
            const matchingProduct = productsInCart.find(p => p.slug === item.productSlug);
            
            return {
                // _id: item._id,
                productSlug: item.productSlug,
                price: item.price,
                quantity: item.quantity,
                product: matchingProduct ? {
                    // _id: matchingProduct._id,
                    name: matchingProduct.name,
                    images: matchingProduct.images,
                    slug: matchingProduct.slug
                } : null
            };
        });

        res.status(200).json({ 
            status: "success", 
            cart: {
                ...cart,
                items: mappedItems
            } 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};


export const deleteFromCart = async (req, res) => {
    try {
        const rawSlug =  req.body.productSlug;
        const productSlug = rawSlug ? rawSlug.trim() : null;
        
        const { quantity = 1 } = req.body; 
        const userSlug = req.user.slug;

  

        if (!productSlug) {
            return res.status(400).json({ status: "error", message: "Product slug is required" });
        }

        let cart = await Cart.findOne({ user: userSlug });
        if (!cart) {
            return res.status(404).json({ status: "error", message: "Cart not found" });
        }


        const itemIndex = cart.items.findIndex(item => item.productSlug === productSlug);
        
        if (itemIndex === -1) {
            return res.status(404).json({ status: "error", message: "Product not found in cart" });
        }

        const item = cart.items[itemIndex];

        if (quantity > item.quantity) {
            return res.status(400).json({ 
                status: "error", 
                message: `you cannot remove more than items quantity` 
            });
        }

        const unitPrice = item.price;
        cart.totalItems -= quantity;
        cart.totalPrice -= (unitPrice * quantity);

        if (item.quantity === quantity) {
            cart.items.splice(itemIndex, 1); 
        } else {
            cart.items[itemIndex].quantity -= quantity;
        }

        if (cart.totalPrice < 0) cart.totalPrice = 0;
        if (cart.totalItems < 0) cart.totalItems = 0;

        await cart.save();

        const slugsInCart = cart.items.map(i => i.productSlug);
        const productsInCart = await Product.find({ slug: { $in: slugsInCart } })
            .select("name images slug")
            .lean();

        const mappedItems = cart.items.map((i) => {
            const matchingProduct = productsInCart.find(p => p.slug === i.productSlug);
            return {
                // _id: i._id,
                productSlug: i.productSlug,
                price: i.price,
                quantity: i.quantity,
                product: matchingProduct ? {
                    // _id: matchingProduct._id,
                    name: matchingProduct.name,
                    images: matchingProduct.images,
                    slug: matchingProduct.slug
                } : null
            };
        });

        return res.status(200).json({ 
            status: "success", 
            cart: {
               // _id: cart._id,
                user: cart.user,
                totalPrice: cart.totalPrice,
                totalItems: cart.totalItems,
                items: mappedItems
            } 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
};