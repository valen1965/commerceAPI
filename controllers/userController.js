const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const {
  createTokenUser,
  attachCookiesToResponse,
  checkPermissions,
} = require('../utils');

const getAllUsers = async (req, res) => {
  console.log(req.user);
  // const users = await User.find({ role: 'user' }, 'name email _id role');
  const users = await User.find({ role: 'user' }).select('-password');
  if (users.length < 1) {
    throw new CustomError.NotFoundError('Users list is empty');
  }
  res.status(StatusCodes.OK).json({
    count: `${users.length}`,
    users,
  });
};

const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user });
};

// update user with user.save

const updateUser = async (req, res) => {
  const { email, name } = req.body;
  if (!name || !email) {
    throw new CustomError.BadRequestError('invalid credentials ');
  }
  //update user with save method
  const user = await User.findOne({ _id: req.user.userId });
  user.email = email;
  user.name = name;
  await user.save();

  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError('Please provide  both values');
  }
  const user = await User.findOne({ _id: req.user.userId });

  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid password');
  }
  user.password = newPassword;
  await user.save();
  res.status(StatusCodes.OK).json({ msg: 'Success! password updated' });
};

const getSingleUser = async (req, res) => {
  // const {
  //   params: { id: userId },
  // } = req;
  // const singleUser = await User.findById({ _id: userId }, 'name email');
  const singleUser = await User.findOne({ _id: req.params.id }).select(
    '-password'
  );
  if (!singleUser) {
    throw new CustomError.NotFoundError(
      `No user with id: ${req.params.id} found`
    );
  }
  checkPermissions(req.user, singleUser._id);
  res.status(StatusCodes.OK).json({ singleUser });
};

module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
};

//update user with findOneAndUpdate

// const updateUser = async (req, res) => {
//   const { email, name } = req.body;
//   if (!name || !email) {
//     throw new CustomError.BadRequestError('invalid credentials ');
//   }
//   const user = await User.findOneAndUpdate(
//     { _id: req.user.userId },
//     { email, name },
//     { new: true, runValidators: true }
//   );
//   const tokenUser = createTokenUser(user);
//   attachCookiesToResponse({ res, user: tokenUser });
//   res.status(StatusCodes.OK).json({ user: tokenUser });
// };
