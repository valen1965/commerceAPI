const Product = require('../models/Product');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { checkPermissions } = require('../utils');
const path = require('path');

const createProduct = async (req, res) => {
  req.body.user = req.user.userId;
  const product = await Product.create(req.body);

  checkPermissions(req.user, req.user.userId);
  res.status(StatusCodes.CREATED).json({ product });
};

const getAllProducts = async (req, res) => {
  const products = await Product.find({});
  if (products.length < 1) {
    res.status(StatusCodes.BAD_REQUEST).json('No products in the list');
  }
  res.status(StatusCodes.OK).json({
    count: products.length,
    products,
  });
};

const getSingleProduct = async (req, res) => {
  const { id: productId } = req.params;
  const singleProduct = await Product.findOne({ _id: productId }).populate(
    'reviews'
  );
  if (!singleProduct) {
    throw new CustomError.NotFoundError(
      `No product with id: ${productId} found`
    );
  }
  res.status(StatusCodes.OK).json({ singleProduct });
};

const updateProduct = async (req, res) => {
  const { id: productId } = req.params;
  const product = await Product.findOneAndUpdate({ _id: productId }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new CustomError.NotFoundError(
      `Product with id ${productId} not found`
    );
  }
  res.status(StatusCodes.OK).json({ product });
};

const deleteProduct = async (req, res) => {
  const { id: productId } = req.params;
  const product = await Product.findOne({ _id: productId });
  if (!product) {
    throw new CustomError.NotFoundError(
      `Product with id ${productId} not found`
    );
  }

  await product.remove();

  res.status(StatusCodes.OK).json({ msg: 'Success! Product removed' });
};

const uploadImage = async (req, res) => {
  if (!req.files) {
    throw new CustomError.BadRequestError('No file Uploaded');
  }
  const productImage = req.files.Image;
  if (!productImage.mimetype.startsWith('image/jpeg')) {
    throw new CustomError.BadRequestError('Please upload image');
  }

  const maxSize = 1024 * 1024;

  if (productImage.size > maxSize) {
    throw new CustomError.BadRequestError('Image size should not exceed 1MB');
  }

  const imagePath = path.join(
    __dirname,
    '../public/uploads/' + `${productImage.name}`
  );

  await productImage.mv(imagePath);

  res.status(StatusCodes.OK).json({ image: `/uploads/${productImage.name}` });
};

module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
};
