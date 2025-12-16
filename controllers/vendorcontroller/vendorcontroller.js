import Vendor from "../../models/venderschema.js";
import Store from "../../models/Stores/storeschema.js";
import FashionStore from "../../models/Stores/fashionstoreschema.js";
import User from "../../models/userschema.js";
import { calculateDistance } from "../../utils/distance.js";

export const vendorProfile = async (req, res) => {
  console.log("Vendor profile contorller is hittin ------ >");
  try {
    const vendor = req.vendor;
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "No vendor Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Vendor profile found successfully ",
      vendor,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Vendor Profile, Internal Server Error!",
    });
  }
};

//This is Grocerry Store  --- >

export const createStore = async (req, res) => {
  try {
    const vendor = req.vendor;

    if (!vendor?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let {
      storeName,
      description,
      phone,
      email,
      address,

      geoLocation,
      openingHours,
      status,
      delivery,
      tax,
    } = req.body;

    if (!storeName) {
      return res.status(400).json({
        success: false,
        message: "Store name required",
      });
    }

    // Parse JSON strings
    if (typeof address === "string") address = JSON.parse(address);
    if (typeof geoLocation === "string") geoLocation = JSON.parse(geoLocation);
    if (typeof openingHours === "string")
      openingHours = JSON.parse(openingHours);
    if (typeof delivery === "string") delivery = JSON.parse(delivery);
    if (typeof tax === "string") tax = JSON.parse(tax);

    // Geo validation
    if (geoLocation?.lat === undefined || geoLocation?.lng === undefined) {
      return res.status(400).json({
        success: false,
        message: "Geo location required",
      });
    }

    // ✅ Correct image handling
    const storeImage = req.file ? req.file.path : null;

    const store = await Store.create({
      vendorId: vendor._id,
      storeName,
      storeImage,
      description: description || "",
      phone: phone || "",
      email: email || "",

      address: {
        street: address?.street || "",
        city: address?.city || "",
        state: address?.state || "",
        pincode: address?.pincode || "",
        landmark: address?.landmark || "",
      },

      geoLocation: {
        lat: geoLocation.lat,
        lng: geoLocation.lng,
      },

      openingHours: {
        open: openingHours?.open || "09:00",
        close: openingHours?.close || "21:00",
      },

      status: status || "active",

      delivery: {
        type: delivery?.type || "per_km",
        perKmCharge: delivery?.perKmCharge || 0,
        flatCharge: delivery?.flatCharge || 0,
        maxRadiusKm: delivery?.maxRadiusKm || 10,
        baseDeliveryTime: delivery?.baseDeliveryTime || 20,
        timePerKm: delivery?.timePerKm || 5,
      },

      tax: {
        gstPercent: tax?.gstPercent || 0,
      },
    });

    res.status(201).json({
      success: true,
      message: "Store created successfully",
      store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create fashion store

export const createFashionStore = async (req, res) => {
  try {
    const vendor = req.vendor;

    if (!vendor?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let {
      storeName,
      description,
      phone,
      email,
      address,
      geoLocation,
      openingHours,
      status,
      shopCategory,
      brandsAvailable,
      hasTrialRoom,
      returnPolicyDays,
      exchangeAvailable,
      delivery,
      tax,
    } = req.body;

    if (!storeName) {
      return res.status(400).json({
        success: false,
        message: "Store name is required",
      });
    }

    if (geoLocation?.lat == null || geoLocation?.lng == null) {
      return res.status(400).json({
        success: false,
        message: "Geo location (lat, lng) is required",
      });
    }

    // ================= IMAGES =================
    const storeImage = req.file ? req.file.path : null;

    const store = await FashionStore.create({
      vendorId: vendor._id,
      storeName,
      storeImage,
      description: description || "",
      phone: phone || "",
      email: email || "",

      address: {
        street: address?.street || "",
        city: address?.city || "",
        state: address?.state || "",
        pincode: address?.pincode || "",
        landmark: address?.landmark || "",
      },

      geoLocation: {
        lat: geoLocation.lat,
        lng: geoLocation.lng,
      },

      openingHours: {
        open: openingHours?.open || "10:00",
        close: openingHours?.close || "22:00",
      },

      status: status || "active",

      shopCategory: shopCategory || "unisex",
      brandsAvailable: brandsAvailable || [],
      hasTrialRoom: hasTrialRoom || false,
      returnPolicyDays: returnPolicyDays || 0,
      exchangeAvailable: exchangeAvailable || false,

      delivery: {
        type: delivery?.type || "per_km",
        perKmCharge: delivery?.perKmCharge || 0,
        flatCharge: delivery?.flatCharge || 0,
        maxRadiusKm: delivery?.maxRadiusKm || 10,
        baseDeliveryTime: delivery?.baseDeliveryTime || 20,
        timePerKm: delivery?.timePerKm || 5,
      },

      tax: {
        gstPercent: tax?.gstPercent || 5,
      },
    });

    res.status(201).json({
      success: true,
      message: "Fashion store created successfully",
      store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllStores = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // Fetch data from all collections
    const [fashionStores, groceryStores] = await Promise.all([
      FashionStore.find().populate("vendorId", "name phone email").lean(),

      Store.find().populate("vendorId", "name phone email").lean(),
    ]);

    // Add storeType manually
    const allStores = [
      ...fashionStores.map((s) => ({ ...s, storeType: "fashion" })),
      ...groceryStores.map((s) => ({ ...s, storeType: "grocery" })),
    ];

    // Sort by createdAt
    allStores.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination manually
    const paginatedStores = allStores.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      totalStores: allStores.length,
      currentPage: page,
      totalPages: Math.ceil(allStores.length / limit),
      stores: paginatedStores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllFashionStores = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // optional filters
    const { shopCategory, city, status, search } = req.query;

    const filter = {};

    if (shopCategory) filter.shopCategory = shopCategory;
    if (status) filter.status = status;
    if (city) filter["address.city"] = city;

    if (search) {
      filter.storeName = { $regex: search, $options: "i" };
    }

    const stores = await FashionStore.find(filter)
      .populate("vendorId", "name phone email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalStores = await FashionStore.countDocuments(filter);

    res.status(200).json({
      success: true,
      totalStores,
      currentPage: page,
      totalPages: Math.ceil(totalStores / limit),
      hasNextPage: page * limit < totalStores,
      stores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch fashion stores",
      error: error.message,
    });
  }
};

export const getFashionStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await FashionStore.findById(id).populate(
      "vendorId",
      "name phone email"
    );

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Fashion store not found",
      });
    }

    res.status(200).json({
      success: true,
      store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid store ID",
      });
    }

    const store = await Store.findById(id)
      .populate("vendorId", "phone profileImage name ")
      .lean();

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Store fetched successfully",
      store,
    });
  } catch (error) {
    console.error("GET STORE BY ID ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const updateStore = async (req, res) => {
  try {
    const storeId = req.params.storeId;
    const updates = req.body;

    const store = await Store.findByIdAndUpdate(storeId, updates, {
      new: true,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Store updated successfully",
      store,
    });
  } catch (error) {
    console.error("UPDATE STORE ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Error updating store",
      error,
    });
  }
};

export const deleteStore = async (req, res) => {
  try {
    const storeId = req.params.storeId;

    const store = await Store.findByIdAndDelete(storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Store deleted successfully",
    });
  } catch (error) {
    console.error("DELETE STORE ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting store",
      error,
    });
  }
};

export const getStoresWithDistance = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user || !user.geoLocation) {
      return res.status(404).json({
        success: false,
        message: "User location not found",
      });
    }

    const { lat: userLat, lng: userLng } = user.geoLocation;

    const stores = await Store.find({ status: "active" }).populate(
      "vendorId",
      "phone"
    );

    const storesWithDistance = stores.map((store) => {
      const storeLat = store.geoLocation.lat;
      const storeLng = store.geoLocation.lng;

      const distance = calculateDistance(userLat, userLng, storeLat, storeLng);

      return {
        ...store.toObject(),
        distance: distance.toFixed(2) + " km",
      };
    });

    res.status(200).json({
      success: true,
      stores: storesWithDistance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};








