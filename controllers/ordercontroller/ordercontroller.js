
import Address from "../../models/addressschema.js";
import Store from "../../models/Stores/storeschema.js";

export const createOrder = async (req, res) => {
  try {
    const { mode, storeId, items } = req.body;
    const userId = req.user.id;

    if (mode !== "store") {
      return res.status(400).json({
        success: false,
        message: "Invalid order mode",
      });
    }

    // ✅ Check user address
    const address = await Address.findOne({
      userId,
      isDefault: true,
    });

    if (!address) {
      return res.status(400).json({
        success: false,
        code: "ADDRESS_REQUIRED",
        message: "Please add address before placing order",
      });
    }

    const store = await Store.findOne({
      _id: storeId,
      status: "active",
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found or inactive",
      });
    }

    // 📍 Distance & time
    const distanceKm = calculateDistance(
      address.geoLocation.lat,
      address.geoLocation.lng,
      store.geoLocation.lat,
      store.geoLocation.lng
    );

    const deliveryTime = calculateDeliveryTime(distanceKm);

    let totalAmount = 0;
    const orderItems = [];

    for (let item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        storeId: store._id,
        stock: { $gte: item.quantity },
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Product not available in this store",
        });
      }

      totalAmount += product.price * item.quantity;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
      });

      product.stock -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      userId,
      storeId: store._id,
      items: orderItems,
      totalAmount,
      deliveryAddress: address._id,
      distanceKm: distanceKm.toFixed(2),
      estimatedDeliveryTime: deliveryTime,
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      distance: `${distanceKm.toFixed(2)} km`,
      estimatedDeliveryTime: deliveryTime,
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
