<?php
/**
 * Intelephense/PHPStan stubs for Laravel framework
 * This file helps static analysis tools understand Laravel's magic methods and helpers
 */

namespace Illuminate\Http {
    class Request {
        /**
         * @param string $key
         * @param mixed $default
         * @return mixed
         */
        public function has($key) {}
        
        /**
         * @param string $key
         * @param mixed $default
         * @return mixed
         */
        public function __get($key) {}
        
        /**
         * @param string $key
         * @return mixed
         */
        public function input($key = null, $default = null) {}
        
        /**
         * @return array
         */
        public function all() {
            return [];
        }
        
        /**
         * @param string|array $keys
         * @return array
         */
        public function only($keys) {
            return [];
        }
    }
    
    class JsonResponse {
        /**
         * @param mixed $data
         * @param int $status
         * @param array $headers
         * @return static
         */
        public static function json($data = null, $status = 200, array $headers = []) {
            return new static();
        }
        
        /**
         * @param mixed $data
         * @param int $status
         * @param array $headers
         */
        public function __construct($data = null, $status = 200, array $headers = []) {}
    }
    
    class Response {
        /**
         * @param mixed $content
         * @param int $status
         * @param array $headers
         * @return static
         */
        public static function json($data = null, $status = 200, array $headers = []) {
            return new static();
        }
    }
}

namespace Illuminate\Routing {
    class Controller {
        /**
         * @param string|array $middleware
         * @param array $options
         * @return static|\Illuminate\Routing\Route|object|string
         */
        public function middleware($middleware, array $options = []) {
            return $this;
        }
    }
    
    class Route {
    }
}

namespace Illuminate\Database {
    class Seeder {
        /**
         * Run the database seeds.
         *
         * @return void
         */
        public function run() {}
        
        /**
         * @var \Illuminate\Console\Command
         */
        protected $command;
    }
}

namespace Illuminate\Console {
    class Command {
        /**
         * @param string $string
         * @return void
         */
        public function info($string) {}
        
        /**
         * @param string $string
         * @return void
         */
        public function line($string) {}
        
        /**
         * @param string $string
         * @return void
         */
        public function error($string) {}
        
        /**
         * @param string $string
         * @return void
         */
        public function warn($string) {}
    }
}

namespace Illuminate\Foundation\Auth\Access {
    trait AuthorizesRequests {
        /**
         * @param mixed $ability
         * @param mixed|array $arguments
         * @return void
         */
        public function authorize($ability, $arguments = []) {}
        
        /**
         * @param mixed $ability
         * @param mixed|array $arguments
         * @return bool
         */
        public function authorizeForUser($user, $ability, $arguments = []) {
            return false;
        }
    }
}

namespace Illuminate\Foundation\Validation {
    trait ValidatesRequests {
        /**
         * @param \Illuminate\Http\Request $request
         * @param array $rules
         * @param array $messages
         * @param array $customAttributes
         * @return array
         */
        public function validate($request, array $rules, array $messages = [], array $customAttributes = []) {
            return [];
        }
        
        /**
         * @param \Illuminate\Http\Request $request
         * @param array $rules
         * @param array $messages
         * @param array $customAttributes
         * @return array
         */
        public function validateWithBag($errorBag, $request, array $rules, array $messages = [], array $customAttributes = []) {
            return [];
        }
    }
}

namespace Illuminate\Support\Facades {
    class Auth {
        /**
         * @return \Illuminate\Contracts\Auth\Authenticatable|null
         */
        public static function user() {
            return null;
        }
    }
    
    class Validator {
        /**
         * @param array $data
         * @param array $rules
         * @param array $messages
         * @param array $customAttributes
         * @return \Illuminate\Contracts\Validation\Validator
         */
        public static function make(array $data, array $rules, array $messages = [], array $customAttributes = []) {
            return new \Illuminate\Contracts\Validation\ValidatorImpl();
        }
    }
    
    class Log {
        /**
         * @param string $message
         * @param array $context
         * @return void
         */
        public static function error($message, array $context = []) {}
        
        /**
         * @param string $message
         * @param array $context
         * @return void
         */
        public static function debug($message, array $context = []) {}
    }
    
    class Hash {
        /**
         * @param string $value
         * @return string
         */
        public static function make($value) {
            return '';
        }
        
        /**
         * @param string $value
         * @param string $hashedValue
         * @return bool
         */
        public static function check($value, $hashedValue) {
            return false;
        }
    }
}

namespace Illuminate\Contracts\Validation {
    interface Validator {
        /**
         * @return bool
         */
        public function fails();
        
        /**
         * @return \Illuminate\Support\MessageBag
         */
        public function errors();
        
        /**
         * @param callable|string $callback
         * @return static
         */
        public function after($callback);
        
        /**
         * @return array
         */
        public function failed();
        
        /**
         * @param string $attribute
         * @param string|array $rules
         * @param callable $callback
         * @return static
         */
        public function sometimes($attribute, $rules, callable $callback);
        
        /**
         * @return array
         */
        public function validate();
        
        /**
         * @return array
         */
        public function validated();
        
        /**
         * @return \Illuminate\Support\MessageBag
         */
        public function getMessageBag();
    }
    
    class ValidatorImpl implements Validator {
        /**
         * @return bool
         */
        public function fails() {
            return false;
        }
        
        /**
         * @return \Illuminate\Support\MessageBag
         */
        public function errors() {
            return new \Illuminate\Support\MessageBag();
        }
        
        /**
         * @param callable|string $callback
         * @return static
         */
        public function after($callback) {
            return $this;
        }
        
        /**
         * @return array
         */
        public function failed() {
            return [];
        }
        
        /**
         * @param string $attribute
         * @param string|array $rules
         * @param callable $callback
         * @return static
         */
        public function sometimes($attribute, $rules, callable $callback) {
            return $this;
        }
        
        /**
         * @return array
         */
        public function validate() {
            return [];
        }
        
        /**
         * @return array
         */
        public function validated() {
            return [];
        }
        
        /**
         * @return \Illuminate\Support\MessageBag
         */
        public function getMessageBag() {
            return new \Illuminate\Support\MessageBag();
        }
    }
}

namespace Illuminate\Support {
    class MessageBag {
    }
}

namespace Illuminate\Database\Eloquent {
    class Model {
        /**
         * @param string $column
         * @param mixed $operator
         * @param mixed $value
         * @return \Illuminate\Database\Eloquent\Builder
         */
        public static function where($column, $operator = null, $value = null) {
            return new Builder();
        }
        
        /**
         * @return \Illuminate\Database\Eloquent\Builder
         */
        public static function query() {
            return new Builder();
        }
        
        /**
         * @param mixed $id
         * @param array $columns
         * @return static|null
         */
        public static function find($id, $columns = ['*']) {
            return null;
        }
        
        /**
         * @param mixed $id
         * @param array $columns
         * @return static
         */
        public static function findOrFail($id, $columns = ['*']) {
            return new static();
        }
        
        /**
         * @param array $attributes
         * @return static
         */
        public static function create(array $attributes = []) {
            return new static();
        }
        
        /**
         * @param string|array $relations
         * @return \Illuminate\Database\Eloquent\Builder
         */
        public static function with($relations) {
            return new Builder();
        }
        
        /**
         * @return bool
         */
        public function save() {
            return false;
        }
        
        /**
         * @param array $attributes
         * @return bool
         */
        public function update(array $attributes = []) {
            return false;
        }
        
        /**
         * @param string|array $relations
         * @return static
         */
        public function load($relations) {
            return $this;
        }
    }
    
    class Builder {
        /**
         * @param string|\Closure $column
         * @param mixed $operator
         * @param mixed $value
         * @return static
         */
        public function where($column, $operator = null, $value = null) {
            return $this;
        }
        
        /**
         * @param string|\Closure $column
         * @param mixed $operator
         * @param mixed $value
         * @return static
         */
        public function orWhere($column, $operator = null, $value = null) {
            return $this;
        }
        
        /**
         * @param string $column
         * @param array $values
         * @return static
         */
        public function whereBetween($column, array $values) {
            return $this;
        }
        
        /**
         * @param string $column
         * @param string $direction
         * @return static
         */
        public function orderBy($column, $direction = 'asc') {
            return $this;
        }
        
        /**
         * @param string|array $relations
         * @return static
         */
        public function with($relations) {
            return $this;
        }
        
        /**
         * @return static|null
         */
        public function first() {
            return null;
        }
        
        /**
         * @return static
         */
        public function firstOrFail() {
            return $this;
        }
        
        /**
         * @param mixed $id
         * @param array $columns
         * @return static|null
         */
        public function find($id, $columns = ['*']) {
            return null;
        }
        
        /**
         * @param mixed $id
         * @param array $columns
         * @return static
         */
        public function findOrFail($id, $columns = ['*']) {
            return $this;
        }
        
        /**
         * @param int $perPage
         * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
         */
        public function paginate($perPage = 15) {
            return new \Illuminate\Contracts\Pagination\LengthAwarePaginator();
        }
    }
}

namespace Carbon {
    class Carbon {
        /**
         * @return static
         */
        public static function today() {
            return new static();
        }
        
        /**
         * @return static
         */
        public static function now() {
            return new static();
        }
        
        /**
         * @param string $time
         * @return static
         */
        public static function parse($time) {
            return new static();
        }
        
        /**
         * @param \DateTimeInterface|string|null $date
         * @return int
         */
        public function diffInMinutes($date = null) {
            return 0;
        }
    }
}

namespace Illuminate\Contracts\Pagination {
    class LengthAwarePaginator {
    }
}

namespace Illuminate\Contracts\Auth {
    interface Authenticatable {
    }
    
    interface Guard {
        /**
         * @return \Illuminate\Contracts\Auth\Authenticatable|null
         */
        public function user();
        
        /**
         * @return int|string|null
         */
        public function id();
        
        /**
         * @return bool
         */
        public function check();
        
        /**
         * @return bool
         */
        public function guest();
        
        /**
         * @return bool
         */
        public function hasUser();
        
        /**
         * @param \Illuminate\Contracts\Auth\Authenticatable $user
         * @return void
         */
        public function setUser(Authenticatable $user);
        
        /**
         * @param array $credentials
         * @return bool
         */
        public function validate(array $credentials = []);
    }
    
    interface StatefulGuard extends Guard {
    }
}

namespace Illuminate\Support {
    class Carbon extends \Carbon\Carbon {
    }
}

// Global helper functions
namespace {
    /**
     * @param mixed $content
     * @param int $status
     * @param array $headers
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\Response
     */
    function response($content = '', $status = 200, array $headers = []) {
        return new \Illuminate\Http\JsonResponse($content, $status, $headers);
    }
    
    /**
     * @return \Illuminate\Contracts\Auth\Guard|\Illuminate\Contracts\Auth\StatefulGuard
     */
    function auth() {
        return new \Illuminate\Contracts\Auth\GuardImpl();
    }
    
    /**
     * @return \Illuminate\Support\Carbon
     */
    function now() {
        return new \Illuminate\Support\Carbon();
    }
    
    /**
     * @param string|null $key
     * @param mixed $default
     * @return mixed
     */
    function config($key = null, $default = null) {
        return null;
    }
}

namespace Illuminate\Contracts\Auth {
    class GuardImpl implements Guard {
        /**
         * @return \Illuminate\Contracts\Auth\Authenticatable|null
         */
        public function user() {
            return null;
        }
        
        /**
         * @return int|string|null
         */
        public function id() {
            return null;
        }
        
        /**
         * @return bool
         */
        public function check() {
            return false;
        }
        
        /**
         * @return bool
         */
        public function guest() {
            return false;
        }
        
        /**
         * @return bool
         */
        public function hasUser() {
            return false;
        }
        
        /**
         * @param \Illuminate\Contracts\Auth\Authenticatable $user
         * @return void
         */
        public function setUser(Authenticatable $user) {}
        
        /**
         * @param array $credentials
         * @return bool
         */
        public function validate(array $credentials = []) {
            return false;
        }
    }
}

// JWT Auth package stubs
namespace Tymon\JWTAuth\Facades {
    class JWTAuth {
        /**
         * @param array $credentials
         * @return string|false
         */
        public static function attempt(array $credentials) {
            return false;
        }
        
        /**
         * @param \Illuminate\Contracts\Auth\Authenticatable $user
         * @return string
         */
        public static function fromUser($user) {
            return '';
        }
        
        /**
         * @return string|null
         */
        public static function getToken() {
            return null;
        }
        
        /**
         * @param string|\Tymon\JWTAuth\Token $token
         * @return bool
         */
        public static function invalidate($token) {
            return false;
        }
        
        /**
         * @param string|\Tymon\JWTAuth\Token $token
         * @return string
         */
        public static function refresh($token) {
            return '';
        }
    }
}

namespace Tymon\JWTAuth {
    class Token {
    }
}

namespace Tymon\JWTAuth\Exceptions {
    class JWTException extends \Exception {}
}