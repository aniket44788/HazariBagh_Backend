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

export const updateVendor = async (req, res) => {
  console.log("Update Vendor Is hitting -- >");

  try {
    const vendorId = req.vendor._id;
    console.log(vendorId);
    const { name, phone, email, address, geoLocation } = req.body;

    const vendor = await Vendor.findById(vendorId);
    console.log(vendor);

    if (!vendor) {
      return res.status(400).json({
        success: false,
        message: "Failed to found vendor",
      });
    }

    if (name) vendor.name = name.trim();

    // email (unique check)
    if (email && email !== vendor.email) {
      const emailExists = await Vendor.findOne({
        email: email.toLowerCase(),
        _id: { $ne: vendorId },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }

      vendor.email = email.toLowerCase();
    }

    // address (object merge)
    if (address) {
      vendor.address = {
        ...vendor.address,
        ...address,
      };
    }

    // geoLocation
    if (geoLocation) {
      vendor.geoLocation = {
        lat: geoLocation.lat ?? vendor.geoLocation.lat,
        lng: geoLocation.lng ?? vendor.geoLocation.lng,
      };
    }

    // images
    if (req.files?.profileImage) {
      vendor.profileImage = `/uploads/${req.files.profileImage[0].filename}`;
    }

    if (req.files?.shopImage) {
      vendor.shopImage = `/uploads/${req.files.shopImage[0].filename}`;
    }

    await vendor.save();

    return res.status(200).json({
      success: true,
      message: "Vendor profile updated successfully",
      vendor,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update Vendor Profile, Internal Server Error",
      error,
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

export const updateStore = async (req, res) => {
  try {
    const vendorId = req.vendor?._id;
    // const storeId = req.params._id;
    const { id } = req.params;

    console.log("UPDATE STORE => vendorId:", vendorId);
    console.log("UPDATE STORE => storeId:", id);
    console.log("UPDATE STORE => body:", req.body);

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const store = await Store.findOne({
      _id: id,
      vendorId,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found or access denied",
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

    // 🧠 Parse JSON strings (same as createStore)
    if (typeof address === "string") address = JSON.parse(address);
    if (typeof geoLocation === "string") geoLocation = JSON.parse(geoLocation);
    if (typeof openingHours === "string")
      openingHours = JSON.parse(openingHours);
    if (typeof delivery === "string") delivery = JSON.parse(delivery);
    if (typeof tax === "string") tax = JSON.parse(tax);

    // 🔍 Geo validation (only if provided)
    if (geoLocation) {
      console.log("GeoLocation update requested:", geoLocation);

      if (geoLocation.lat === undefined || geoLocation.lng === undefined) {
        return res.status(400).json({
          success: false,
          message: "Invalid geo location",
        });
      }

      store.geoLocation.lat = geoLocation.lat;
      store.geoLocation.lng = geoLocation.lng;
    }

    // 🖼️ Image update (optional)
    if (req.file) {
      console.log("Updating store image:", req.file.path);
      store.storeImage = req.file.path;
    }

    // ✏️ Basic fields
    if (storeName) store.storeName = storeName;
    if (description !== undefined) store.description = description;
    if (phone !== undefined) store.phone = phone;
    if (email !== undefined) store.email = email.toLowerCase();
    if (status) store.status = status;

    // 🏠 Address update
    if (address) {
      store.address.street = address.street ?? store.address.street;
      store.address.city = address.city ?? store.address.city;
      store.address.state = address.state ?? store.address.state;
      store.address.pincode = address.pincode ?? store.address.pincode;
      store.address.landmark = address.landmark ?? store.address.landmark;
    }

    // ⏰ Opening hours
    if (openingHours) {
      store.openingHours.open = openingHours.open ?? store.openingHours.open;
      store.openingHours.close = openingHours.close ?? store.openingHours.close;
    }

    // 🚚 Delivery update
    if (delivery) {
      store.delivery.type = delivery.type ?? store.delivery.type;
      store.delivery.perKmCharge =
        delivery.perKmCharge ?? store.delivery.perKmCharge;
      store.delivery.flatCharge =
        delivery.flatCharge ?? store.delivery.flatCharge;
      store.delivery.maxRadiusKm =
        delivery.maxRadiusKm ?? store.delivery.maxRadiusKm;
      store.delivery.baseDeliveryTime =
        delivery.baseDeliveryTime ?? store.delivery.baseDeliveryTime;
      store.delivery.timePerKm = delivery.timePerKm ?? store.delivery.timePerKm;
    }

    // 💰 Tax update
    if (tax) {
      if (tax.gstPercent < 0 || tax.gstPercent > 28) {
        return res.status(400).json({
          success: false,
          message: "GST percent must be between 0 and 28",
        });
      }
      store.tax.gstPercent = tax.gstPercent;
    }

    await store.save();

    console.log("STORE UPDATED SUCCESSFULLY");

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
      error: error.message,
    });
  }
};

// This is  fashion store  ----- >

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

export const updateFashionStore = async (req, res) => {
  try {
    const vendorId = req.vendor?._id;
    const { id } = req.params;

    console.log("UPDATE FASHION STORE => vendorId:", vendorId);
    console.log("UPDATE FASHION STORE => storeId:", id);
    console.log("UPDATE FASHION STORE => body:", req.body);

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 🔐 Vendor ownership check
    const store = await FashionStore.findOne({
      _id: id,
      vendorId,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Fashion store not found or access denied",
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

    // 🖼️ Image update
    if (req.file) {
      console.log("Updating store image:", req.file.path);
      store.storeImage = req.file.path;
    }

    // ✏️ Basic fields
    if (storeName) store.storeName = storeName;
    if (description !== undefined) store.description = description;
    if (phone !== undefined) store.phone = phone;
    if (email !== undefined) store.email = email.toLowerCase();
    if (status) store.status = status;

    // 🏠 Address update
    if (address) {
      store.address.street = address.street ?? store.address.street;
      store.address.city = address.city ?? store.address.city;
      store.address.state = address.state ?? store.address.state;
      store.address.pincode = address.pincode ?? store.address.pincode;
      store.address.landmark = address.landmark ?? store.address.landmark;
    }

    // 🌍 Geo location (validate only if provided)
    if (geoLocation) {
      if (geoLocation.lat == null || geoLocation.lng == null) {
        return res.status(400).json({
          success: false,
          message: "Geo location (lat, lng) is required",
        });
      }
      store.geoLocation.lat = geoLocation.lat;
      store.geoLocation.lng = geoLocation.lng;
    }

    // ⏰ Opening hours
    if (openingHours) {
      store.openingHours.open = openingHours.open ?? store.openingHours.open;
      store.openingHours.close = openingHours.close ?? store.openingHours.close;
    }

    // 👕 Fashion specific fields
    if (shopCategory) store.shopCategory = shopCategory;
    if (brandsAvailable) store.brandsAvailable = brandsAvailable;
    if (hasTrialRoom !== undefined) store.hasTrialRoom = hasTrialRoom;
    if (returnPolicyDays !== undefined)
      store.returnPolicyDays = returnPolicyDays;
    if (exchangeAvailable !== undefined)
      store.exchangeAvailable = exchangeAvailable;

    // 🚚 Delivery
    if (delivery) {
      store.delivery.type = delivery.type ?? store.delivery.type;
      store.delivery.perKmCharge =
        delivery.perKmCharge ?? store.delivery.perKmCharge;
      store.delivery.flatCharge =
        delivery.flatCharge ?? store.delivery.flatCharge;
      store.delivery.maxRadiusKm =
        delivery.maxRadiusKm ?? store.delivery.maxRadiusKm;
      store.delivery.baseDeliveryTime =
        delivery.baseDeliveryTime ?? store.delivery.baseDeliveryTime;
      store.delivery.timePerKm = delivery.timePerKm ?? store.delivery.timePerKm;
    }

    // 💰 Tax
    if (tax) {
      if (tax.gstPercent < 0 || tax.gstPercent > 28) {
        return res.status(400).json({
          success: false,
          message: "GST percent must be between 0 and 28",
        });
      }
      store.tax.gstPercent = tax.gstPercent;
    }

    await store.save();

    console.log("FASHION STORE UPDATED SUCCESSFULLY");

    return res.status(200).json({
      success: true,
      message: "Fashion store updated successfully",
      store,
    });
  } catch (error) {
    console.error("UPDATE FASHION STORE ERROR =>", error);
    return res.status(500).json({
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

// Delete Store via vendor is pending ?

export const deleteStore = async (req, res) => {
  try {
    const vendorId = req.vendor?._id;
    const storeId = req.params.storeId;

    console.log("DELETE STORE => vendorId:", vendorId);
    console.log("DELETE STORE => storeId:", storeId);

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 🔐 Vendor ownership check
    const store = await Store.findOne({
      _id: storeId,
      vendorId,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found or access denied",
      });
    }

    // ✅ Soft delete
    store.status = "inactive";
    await store.save();

    console.log("STORE SOFT DELETED SUCCESSFULLY");

    return res.status(200).json({
      success: true,
      message: "Store deleted successfully",
    });
  } catch (error) {
    console.error("DELETE STORE ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting store",
      error: error.message,
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
