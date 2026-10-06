# cx

## 作用

1. 只要 className 里有「条件类名」(像 leaving && styles.leaving、isActive && 'x'),就该用这类拼接函数,否则假值会污染 className。