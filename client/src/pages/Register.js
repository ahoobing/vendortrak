import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const tenantData = {
        name: data.tenantName,
        domain: data.domain,
        subdomain: data.subdomain,
      };

      const userData = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      };

      const result = await registerUser(tenantData, userData);
      if (result.success) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Building2 className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Tenant Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Organization Information</h3>
              
              <div>
                <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700">
                  Organization Name
                </label>
                <input
                  id="tenantName"
                  type="text"
                  className="input mt-1"
                  {...register('tenantName', {
                    required: 'Organization name is required',
                    minLength: {
                      value: 2,
                      message: 'Organization name must be at least 2 characters',
                    },
                  })}
                />
                {errors.tenantName && (
                  <p className="mt-1 text-sm text-red-600">{errors.tenantName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                  Domain
                </label>
                <input
                  id="domain"
                  type="text"
                  className="input mt-1"
                  placeholder="example.com"
                  {...register('domain', {
                    required: 'Domain is required',
                    pattern: {
                      value: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
                      message: 'Please enter a valid domain',
                    },
                  })}
                />
                {errors.domain && (
                  <p className="mt-1 text-sm text-red-600">{errors.domain.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
                  Subdomain
                </label>
                <input
                  id="subdomain"
                  type="text"
                  className="input mt-1"
                  placeholder="company"
                  {...register('subdomain', {
                    required: 'Subdomain is required',
                    pattern: {
                      value: /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/,
                      message: 'Subdomain can only contain lowercase letters, numbers, and hyphens',
                    },
                  })}
                />
                {errors.subdomain && (
                  <p className="mt-1 text-sm text-red-600">{errors.subdomain.message}</p>
                )}
              </div>
            </div>

            {/* User Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Admin User Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    className="input mt-1"
                    {...register('firstName', {
                      required: 'First name is required',
                    })}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    className="input mt-1"
                    {...register('lastName', {
                      required: 'Last name is required',
                    })}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input mt-1"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input pr-10 ${
                      watch('password') ? 
                        (errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 
                         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(watch('password')) ? 
                         'border-green-500 focus:border-green-500 focus:ring-green-500' : 
                         'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500') : 
                        ''
                    }`}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                      },
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
                
                {/* Password Strength Meter */}
                {watch('password') && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Password strength:</span>
                      <span className={(() => {
                        const password = watch('password') || '';
                        if (password.length === 0) return 'text-gray-400';
                        if (password.length < 8) return 'text-red-500';
                        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) return 'text-yellow-500';
                        return 'text-green-500';
                      })()}>
                        {(() => {
                          const password = watch('password') || '';
                          if (password.length === 0) return 'None';
                          if (password.length < 8) return 'Weak';
                          if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) return 'Fair';
                          return 'Strong';
                        })()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          (() => {
                            const password = watch('password') || '';
                            if (password.length === 0) return 'w-0 bg-gray-300';
                            if (password.length < 8) return 'w-1/4 bg-red-500';
                            if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) return 'w-2/3 bg-yellow-500';
                            return 'w-full bg-green-500';
                          })()
                        }`}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Password Requirements */}
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Password requirements:</p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className={`flex items-center ${watch('password')?.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${watch('password')?.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      At least 8 characters
                    </div>
                    <div className={`flex items-center ${/^(?=.*[a-z])/.test(watch('password') || '') ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${/^(?=.*[a-z])/.test(watch('password') || '') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      One lowercase letter
                    </div>
                    <div className={`flex items-center ${/^(?=.*[A-Z])/.test(watch('password') || '') ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${/^(?=.*[A-Z])/.test(watch('password') || '') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      One uppercase letter
                    </div>
                    <div className={`flex items-center ${/^(?=.*\d)/.test(watch('password') || '') ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${/^(?=.*\d)/.test(watch('password') || '') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      One number
                    </div>
                    <div className={`flex items-center ${/^(?=.*[@$!%*?&])/.test(watch('password') || '') ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${/^(?=.*[@$!%*?&])/.test(watch('password') || '') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      One special character (@$!%*?&)
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`input pr-10 ${
                        watch('confirmPassword') ? 
                          (errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 
                           watch('confirmPassword') === watch('password') && watch('password') ? 
                           'border-green-500 focus:border-green-500 focus:ring-green-500' : 
                           'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500') : 
                          ''
                      }`}
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) => {
                          const password = watch('password');
                          return value === password || 'Passwords do not match';
                        },
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex justify-center"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
