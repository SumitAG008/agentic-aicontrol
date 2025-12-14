# Data Engineer Learning Guide
## Complete Roadmap for ETL/Azure/Databricks/Snowflake Skills

---

# Table of Contents

1. [Job Requirements Overview](#job-requirements-overview)
2. [Learning Path](#learning-path)
3. [Week 1: Databricks Notebooks & Spark](#week-1-databricks-notebooks--spark)
4. [Practice Exercises](#practice-exercises)
5. [Interview Questions](#interview-questions)
6. [What is Databricks?](#what-is-databricks)
7. [Delta Lake](#delta-lake)
8. [Unity Catalog](#unity-catalog)
9. [Zero-Copy Replication](#zero-copy-replication)
10. [Why Databricks/Snowflake vs iPaaS?](#why-databrickssnowflake-vs-ipaas)

---

# Job Requirements Overview

## Target Role: Data Engineer (ETL/Azure/SAP)

| Skill | Priority | Your Status |
|-------|----------|-------------|
| ETL Development | High | To Learn |
| Python | High | To Learn |
| SQL | High | To Learn |
| Microsoft Azure (ADF, Databricks) | High | To Learn |
| Snowflake | High | To Learn |
| SAP Data Structures | High | ✅ Known |
| Qlik Replicate | Medium | Nice to have |

---

# Learning Path

## Focused Plan (5 Months)

```
Month 1-2: Python & SQL Fundamentals
Month 3-4: Azure Data Factory & Databricks
Month 5:   Snowflake
Ongoing:   Build portfolio projects
```

## Monthly Breakdown

### Month 1-2: Python & SQL

#### Python for Data Engineering
| Topic | What to Practice |
|-------|------------------|
| Core Python | Lists, dicts, functions, error handling, file I/O |
| Pandas | DataFrames, filtering, groupby, merging, aggregations |
| API Calls | `requests` library, JSON parsing, pagination handling |
| PySpark basics | RDDs, DataFrames, transformations |

#### SQL Mastery
| Topic | Priority |
|-------|----------|
| JOINs (all types) | High |
| Window functions (ROW_NUMBER, RANK, LAG, LEAD) | High |
| CTEs & subqueries | High |
| Query optimization & execution plans | Medium |
| Stored procedures | Medium |

### Month 3-4: Azure Data Factory & Databricks

#### ADF Core Concepts
```
Week 1: Linked Services, Datasets, Pipelines basics
Week 2: Copy Activity, Data Flows (transformations)
Week 3: Triggers (scheduled, event-based), Parameters
Week 4: Integration with APIs, error handling, monitoring
```

#### Hands-On Projects
| Project | Skills Covered |
|---------|----------------|
| Copy CSV from Blob → SQL Database | Linked services, copy activity |
| REST API → Data Lake | HTTP connector, pagination, JSON parsing |
| Incremental Load pipeline | Watermark pattern, lookups |
| Parameterized pipeline | Dynamic content, expressions |

### Month 5: Snowflake

| Week | Focus |
|------|-------|
| 1 | Architecture, virtual warehouses, databases/schemas |
| 2 | Loading data (COPY INTO, Snowpipe), file formats |
| 3 | Transformations, streams & tasks, time travel |
| 4 | Performance tuning, clustering, zero-copy cloning |

---

# Week 1: Databricks Notebooks & Spark

## Day 1: Getting Started

### Create Your First Cluster
```
Compute → Create Cluster

Settings:
├── Cluster name: learning-cluster
├── Cluster mode: Single Node (cheaper for learning)
├── Node type: m5.large (or smallest available)
├── Terminate after: 30 minutes
└── Databricks Runtime: Latest LTS
```

### Create Your First Notebook
```
Workspace → Users → [your email] → Create → Notebook

Settings:
├── Name: 01_spark_basics
├── Language: Python
└── Cluster: learning-cluster
```

## Day 1-2: PySpark Fundamentals

### Notebook 1: `01_spark_basics`

**Cell 1: Understanding SparkSession**
```python
# SparkSession is already available as 'spark' in Databricks
print(f"Spark Version: {spark.version}")
print(f"App Name: {spark.sparkContext.appName}")
```

**Cell 2: Create DataFrame from Python List**
```python
# Create sample employee data
data = [
    (1, "Rahul", "Data Engineer", 75000, "Mumbai"),
    (2, "Priya", "Data Analyst", 55000, "Delhi"),
    (3, "Amit", "Data Scientist", 90000, "Bangalore"),
    (4, "Sneha", "ETL Developer", 65000, "Pune"),
    (5, "Vikram", "Data Engineer", 80000, "Chennai")
]

columns = ["id", "name", "role", "salary", "city"]

# Create DataFrame
df = spark.createDataFrame(data, columns)

# Display the DataFrame
display(df)
```

**Cell 3: Basic DataFrame Operations**
```python
# Show schema
df.printSchema()

# Count rows
print(f"Total rows: {df.count()}")

# Show first 3 rows
df.show(3)
```

**Cell 4: Selecting Columns**
```python
# Select specific columns
df.select("name", "role", "salary").show()

# Select with alias
from pyspark.sql.functions import col

df.select(
    col("name"),
    col("salary"),
    (col("salary") * 12).alias("annual_salary")
).show()
```

**Cell 5: Filtering Data**
```python
# Filter - salary > 60000
df.filter(col("salary") > 60000).show()

# Filter - multiple conditions
df.filter(
    (col("salary") > 60000) & (col("city") == "Mumbai")
).show()

# Filter - using SQL-like syntax
df.filter("role = 'Data Engineer'").show()
```

## Day 3: Aggregations & Grouping

### Notebook 2: `02_aggregations`

**Cell 1: Setup Data**
```python
# Sales data
sales_data = [
    ("2024-01", "Electronics", "Laptop", 1200, 5),
    ("2024-01", "Electronics", "Phone", 800, 10),
    ("2024-01", "Clothing", "Shirt", 50, 20),
    ("2024-02", "Electronics", "Laptop", 1200, 8),
    ("2024-02", "Electronics", "Phone", 800, 15),
    ("2024-02", "Clothing", "Shirt", 50, 25),
    ("2024-02", "Clothing", "Jeans", 80, 12),
    ("2024-03", "Electronics", "Laptop", 1200, 6),
    ("2024-03", "Clothing", "Shirt", 50, 30)
]

columns = ["month", "category", "product", "price", "quantity"]
sales_df = spark.createDataFrame(sales_data, columns)

display(sales_df)
```

**Cell 2: Basic Aggregations**
```python
from pyspark.sql.functions import sum, avg, count, min, max

# Total quantity sold
sales_df.select(sum("quantity").alias("total_quantity")).show()

# Multiple aggregations
sales_df.select(
    count("*").alias("total_rows"),
    sum("quantity").alias("total_qty"),
    avg("price").alias("avg_price"),
    min("price").alias("min_price"),
    max("price").alias("max_price")
).show()
```

**Cell 3: Group By**
```python
# Sales by category
sales_df.groupBy("category") \
    .agg(
        sum("quantity").alias("total_qty"),
        sum(col("price") * col("quantity")).alias("total_revenue")
    ) \
    .show()

# Sales by month and category
sales_df.groupBy("month", "category") \
    .agg(sum(col("price") * col("quantity")).alias("revenue")) \
    .orderBy("month", "category") \
    .show()
```

**Cell 4: Adding Calculated Columns**
```python
from pyspark.sql.functions import lit, when

# Add revenue column
sales_with_revenue = sales_df.withColumn(
    "revenue",
    col("price") * col("quantity")
)

# Add category tier
sales_with_tier = sales_with_revenue.withColumn(
    "tier",
    when(col("revenue") > 5000, "High")
    .when(col("revenue") > 1000, "Medium")
    .otherwise("Low")
)

display(sales_with_tier)
```

## Day 4: Spark SQL

### Notebook 3: `03_spark_sql`

**Cell 1: Create Temp View for SQL**
```python
# Reuse sales data
sales_data = [
    ("2024-01", "Electronics", "Laptop", 1200, 5),
    ("2024-01", "Electronics", "Phone", 800, 10),
    ("2024-01", "Clothing", "Shirt", 50, 20),
    ("2024-02", "Electronics", "Laptop", 1200, 8),
    ("2024-02", "Electronics", "Phone", 800, 15),
    ("2024-02", "Clothing", "Shirt", 50, 25),
    ("2024-02", "Clothing", "Jeans", 80, 12),
    ("2024-03", "Electronics", "Laptop", 1200, 6),
    ("2024-03", "Clothing", "Shirt", 50, 30)
]

sales_df = spark.createDataFrame(sales_data, ["month", "category", "product", "price", "quantity"])

# Register as temporary view
sales_df.createOrReplaceTempView("sales")

print("View 'sales' created!")
```

**Cell 2: Basic SQL Queries**
```sql
%sql
SELECT * FROM sales
```

**Cell 3: SQL Filtering and Aggregation**
```sql
%sql
-- Total revenue by category
SELECT
    category,
    SUM(price * quantity) as total_revenue,
    SUM(quantity) as total_units
FROM sales
GROUP BY category
ORDER BY total_revenue DESC
```

**Cell 4: SQL with Window Functions**
```sql
%sql
-- Running total by month
SELECT
    month,
    category,
    price * quantity as revenue,
    SUM(price * quantity) OVER (PARTITION BY category ORDER BY month) as running_total
FROM sales
ORDER BY category, month
```

**Cell 5: SQL - CTE Example**
```sql
%sql
-- Common Table Expression
WITH monthly_revenue AS (
    SELECT
        month,
        category,
        SUM(price * quantity) as revenue
    FROM sales
    GROUP BY month, category
)
SELECT
    month,
    category,
    revenue,
    RANK() OVER (PARTITION BY month ORDER BY revenue DESC) as rank
FROM monthly_revenue
```

## Day 5: Reading & Writing Data

### Notebook 4: `04_read_write_data`

**Cell 1: Create Sample Data and Save as CSV**
```python
# Create sample data
employees = [
    (1, "Rahul", "Engineering", 75000),
    (2, "Priya", "Marketing", 55000),
    (3, "Amit", "Engineering", 90000),
    (4, "Sneha", "Sales", 65000),
    (5, "Vikram", "Engineering", 80000)
]

emp_df = spark.createDataFrame(employees, ["id", "name", "department", "salary"])

# Write to CSV
emp_df.write.mode("overwrite").option("header", True).csv("/tmp/employees_csv")

print("CSV written!")
```

**Cell 2: Read CSV Back**
```python
# Read CSV
df_from_csv = spark.read \
    .option("header", True) \
    .option("inferSchema", True) \
    .csv("/tmp/employees_csv")

display(df_from_csv)
df_from_csv.printSchema()
```

**Cell 3: Write as Parquet**
```python
# Parquet is columnar, compressed, faster
emp_df.write.mode("overwrite").parquet("/tmp/employees_parquet")

# Read Parquet
df_from_parquet = spark.read.parquet("/tmp/employees_parquet")
display(df_from_parquet)
```

**Cell 4: Write as Delta Table**
```python
# Delta Lake - ACID transactions, time travel
emp_df.write.mode("overwrite").format("delta").save("/tmp/employees_delta")

# Read Delta
df_from_delta = spark.read.format("delta").load("/tmp/employees_delta")
display(df_from_delta)
```

## Quick Reference Card

| Operation | PySpark | SQL |
|-----------|---------|-----|
| Select | `df.select("col1", "col2")` | `SELECT col1, col2` |
| Filter | `df.filter(col("x") > 5)` | `WHERE x > 5` |
| Group By | `df.groupBy("col").agg(sum("val"))` | `GROUP BY col` |
| Order | `df.orderBy("col")` | `ORDER BY col` |
| Join | `df1.join(df2, "key")` | `JOIN df2 ON key` |
| Add Column | `df.withColumn("new", expr)` | `SELECT *, expr AS new` |

---

# Practice Exercises

## Exercise Set 1: DataFrame Operations

### Setup: E-commerce Orders Data

```python
orders_data = [
    (1001, "2024-01-15", "C001", "Electronics", 1500.00, "Mumbai", "Completed"),
    (1002, "2024-01-15", "C002", "Clothing", 200.00, "Delhi", "Completed"),
    (1003, "2024-01-16", "C001", "Electronics", 800.00, "Mumbai", "Pending"),
    (1004, "2024-01-16", "C003", "Furniture", 2500.00, "Bangalore", "Completed"),
    (1005, "2024-01-17", "C002", "Electronics", 1200.00, "Delhi", "Cancelled"),
    (1006, "2024-01-17", "C004", "Clothing", 350.00, "Chennai", "Completed"),
    (1007, "2024-01-18", "C001", "Furniture", 1800.00, "Mumbai", "Completed"),
    (1008, "2024-01-18", "C005", "Electronics", 950.00, "Pune", "Pending"),
    (1009, "2024-01-19", "C003", "Clothing", 450.00, "Bangalore", "Completed"),
    (1010, "2024-01-19", "C004", "Electronics", 2200.00, "Chennai", "Completed")
]

columns = ["order_id", "order_date", "customer_id", "category", "amount", "city", "status"]
orders_df = spark.createDataFrame(orders_data, columns)
orders_df.createOrReplaceTempView("orders")
```

### Exercise 1: Basic Filtering & Selection

```python
# 1.1 Find all completed orders above 1000
orders_df.filter((col("status") == "Completed") & (col("amount") > 1000)).show()

# 1.2 Find orders from Mumbai or Delhi
orders_df.filter(col("city").isin("Mumbai", "Delhi")).show()

# 1.3 Select order_id, customer_id, amount - sorted by amount descending
orders_df.select("order_id", "customer_id", "amount").orderBy(col("amount").desc()).show()

# 1.4 Find Electronics orders that are NOT Cancelled
orders_df.filter((col("category") == "Electronics") & (col("status") != "Cancelled")).show()
```

### Exercise 2: Aggregations

```python
# 2.1 Total revenue by category (only Completed orders)
orders_df.filter(col("status") == "Completed") \
    .groupBy("category") \
    .agg(sum("amount").alias("total_revenue")) \
    .show()

# 2.2 Count of orders per city
orders_df.groupBy("city").agg(count("*").alias("order_count")).show()

# 2.3 Average order value by status
orders_df.groupBy("status").agg(avg("amount").alias("avg_order_value")).show()

# 2.4 Find the city with highest total revenue
orders_df.filter(col("status") == "Completed") \
    .groupBy("city") \
    .agg(sum("amount").alias("revenue")) \
    .orderBy(col("revenue").desc()) \
    .limit(1) \
    .show()
```

### Exercise 3: Window Functions

```python
from pyspark.sql.window import Window
from pyspark.sql.functions import row_number, rank, dense_rank, lag, lead

# 3.1 Add row number for each order within each city (ordered by amount desc)
window_city = Window.partitionBy("city").orderBy(col("amount").desc())
orders_df.withColumn("row_num", row_number().over(window_city)).show()

# 3.2 Find the top 1 order (by amount) per category
window_cat = Window.partitionBy("category").orderBy(col("amount").desc())
orders_df.withColumn("rank", rank().over(window_cat)) \
    .filter(col("rank") == 1) \
    .show()

# 3.3 Add a column showing previous order amount for each customer (use lag)
window_cust = Window.partitionBy("customer_id").orderBy("order_date")
orders_df.withColumn("prev_amount", lag("amount", 1).over(window_cust)).show()

# 3.4 Calculate running total of amount per customer
orders_df.withColumn(
    "running_total",
    sum("amount").over(window_cust.rowsBetween(Window.unboundedPreceding, 0))
).show()
```

### Exercise 4: SQL Practice

```sql
-- 4.1 Find customers who placed more than 2 orders
SELECT customer_id, COUNT(*) as order_count
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 2;

-- 4.2 Calculate percentage contribution of each category to total revenue
SELECT
    category,
    SUM(amount) as category_revenue,
    ROUND(SUM(amount) * 100.0 / (SELECT SUM(amount) FROM orders), 2) as percentage
FROM orders
WHERE status = 'Completed'
GROUP BY category;

-- 4.3 Find orders where amount is above average
SELECT * FROM orders
WHERE amount > (SELECT AVG(amount) FROM orders);

-- 4.4 Rank customers by total spending
SELECT
    customer_id,
    SUM(amount) as total_spent,
    RANK() OVER (ORDER BY SUM(amount) DESC) as spending_rank
FROM orders
WHERE status = 'Completed'
GROUP BY customer_id;
```

### Exercise 5: Joins

```python
# Customer Data
customers_data = [
    ("C001", "Rahul Sharma", "Gold", "Mumbai"),
    ("C002", "Priya Singh", "Silver", "Delhi"),
    ("C003", "Amit Patel", "Gold", "Bangalore"),
    ("C004", "Sneha Reddy", "Bronze", "Chennai"),
    ("C005", "Vikram Kumar", "Silver", "Pune"),
    ("C006", "Neha Gupta", "Gold", "Hyderabad")  # No orders
]

customers_df = spark.createDataFrame(customers_data, ["customer_id", "name", "tier", "home_city"])

# 5.1 Join orders with customers - show customer name with each order
orders_df.join(customers_df, "customer_id") \
    .select("order_id", "name", "category", "amount") \
    .show()

# 5.2 Find customers with no orders (use left anti join)
customers_df.join(orders_df, "customer_id", "left_anti").show()

# 5.3 Total revenue by customer tier
orders_df.join(customers_df, "customer_id") \
    .filter(col("status") == "Completed") \
    .groupBy("tier") \
    .agg(sum("amount").alias("total_revenue")) \
    .show()

# 5.4 Find Gold customers from Mumbai with their total order amount
orders_df.join(customers_df, "customer_id") \
    .filter((col("tier") == "Gold") & (col("home_city") == "Mumbai")) \
    .groupBy("customer_id", "name") \
    .agg(sum("amount").alias("total_amount")) \
    .show()
```

---

# Interview Questions

## PySpark / Spark Core

| # | Question | Answer |
|---|----------|--------|
| 1 | **What is Apache Spark?** | Distributed computing framework for big data processing. In-memory processing makes it 100x faster than Hadoop MapReduce. |
| 2 | **Difference between RDD, DataFrame, Dataset?** | **RDD**: Low-level, unstructured, no optimization. **DataFrame**: Structured, optimized (Catalyst), column-based. **Dataset**: Type-safe DataFrame (Scala/Java only). |
| 3 | **What is lazy evaluation?** | Transformations are not executed immediately. Spark builds a DAG and executes only when an action (show, count, write) is called. |
| 4 | **Transformations vs Actions?** | **Transformations**: Return new DataFrame (filter, select, join) - lazy. **Actions**: Trigger execution, return results (show, count, collect). |
| 5 | **What is a Catalyst Optimizer?** | Spark SQL's query optimizer. Analyzes logical plan → optimizes → creates physical plan for execution. |

## Spark Transformations

| # | Question | Answer |
|---|----------|--------|
| 6 | **Narrow vs Wide transformations?** | **Narrow**: No shuffle (filter, select, map). **Wide**: Requires shuffle (groupBy, join, distinct). |
| 7 | **What is shuffling?** | Data redistribution across partitions. Expensive operation - involves disk I/O, network I/O. |
| 8 | **How to avoid shuffle?** | Broadcast small tables, use coalesce instead of repartition, partition data by join keys. |
| 9 | **repartition() vs coalesce()?** | **repartition(n)**: Full shuffle, can increase/decrease partitions. **coalesce(n)**: No shuffle, only decreases partitions. |
| 10 | **What is a broadcast join?** | Small table is sent to all executors. Avoids shuffle of large table. Use when one table < 10MB. |

## SQL & Window Functions

| # | Question | Answer |
|---|----------|--------|
| 11 | **ROW_NUMBER vs RANK vs DENSE_RANK?** | **ROW_NUMBER**: 1,2,3,4 (unique). **RANK**: 1,2,2,4 (gaps). **DENSE_RANK**: 1,2,2,3 (no gaps). |
| 12 | **Find duplicate rows?** | `GROUP BY all_columns HAVING COUNT(*) > 1` or `ROW_NUMBER() OVER(PARTITION BY cols) > 1` |
| 13 | **Find Nth highest salary?** | Use `DENSE_RANK() OVER (ORDER BY salary DESC)` then filter where rank = N |
| 14 | **Running total?** | `SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` |
| 15 | **LAG vs LEAD?** | **LAG**: Access previous row. **LEAD**: Access next row. Useful for calculating differences. |

## Data Engineering / ETL

| # | Question | Answer |
|---|----------|--------|
| 16 | **Full Load vs Incremental Load?** | **Full**: Replace all data every time. **Incremental**: Only load new/changed records (using watermark/timestamp). |
| 17 | **What is SCD Type 1, 2, 3?** | **Type 1**: Overwrite. **Type 2**: Add new row with version/date. **Type 3**: Add new column for old value. |
| 18 | **What is CDC?** | Change Data Capture - tracking inserts, updates, deletes in source systems for incremental loading. |
| 19 | **How to handle late arriving data?** | Watermarking, reprocessing windows, storing raw data with processing timestamps. |
| 20 | **Data quality checks in ETL?** | Null checks, duplicate checks, referential integrity, schema validation, row count validation. |

## Databricks Specific

| # | Question | Answer |
|---|----------|--------|
| 21 | **What is Delta Lake?** | Open-source storage layer with ACID transactions, schema enforcement, time travel on data lakes. |
| 22 | **Delta Lake vs Parquet?** | Delta adds: ACID transactions, versioning, MERGE/UPDATE/DELETE, schema evolution, time travel. |
| 23 | **What is Unity Catalog?** | Centralized governance for Databricks - manages access control, data lineage, auditing across workspaces. |
| 24 | **OPTIMIZE and ZORDER?** | **OPTIMIZE**: Compacts small files. **ZORDER**: Co-locates related data for faster queries on specified columns. |
| 25 | **What is Photon?** | Native vectorized query engine in Databricks - faster execution for SQL and DataFrame operations. |

## Coding Questions

**Q1: Remove duplicates keeping latest record**
```python
from pyspark.sql.window import Window

window = Window.partitionBy("customer_id").orderBy(col("order_date").desc())

df_dedup = orders_df.withColumn("rn", row_number().over(window)) \
    .filter(col("rn") == 1) \
    .drop("rn")
```

**Q2: Pivot - Category as columns, City as rows, Sum of amount**
```python
orders_df.groupBy("city") \
    .pivot("category") \
    .agg(sum("amount")) \
    .show()
```

**Q3: Find customers who ordered in consecutive months**
```sql
WITH monthly_orders AS (
    SELECT DISTINCT customer_id, DATE_TRUNC('month', order_date) as order_month
    FROM orders
)
SELECT a.customer_id
FROM monthly_orders a
JOIN monthly_orders b
ON a.customer_id = b.customer_id
AND a.order_month = ADD_MONTHS(b.order_month, -1)
```

**Q4: Calculate month-over-month growth**
```python
window = Window.partitionBy("category").orderBy("month")

monthly_sales.withColumn("prev_month_revenue", lag("revenue").over(window)) \
    .withColumn("mom_growth",
        ((col("revenue") - col("prev_month_revenue")) / col("prev_month_revenue") * 100)
    ).show()
```

---

# What is Databricks?

## The Problem: Why Does Databricks Exist?

### Traditional Data Processing Challenges

```
SMALL DATA (MBs)
└── Excel, Python pandas, SQL database
└── Works fine on your laptop ✓

BIG DATA (GBs to PBs)
└── Excel crashes ✗
└── Pandas runs out of memory ✗
└── Single database too slow ✗

Problem: How do you process 1TB+ of data?
```

### The Solution: Distributed Computing

```
Instead of 1 powerful computer:
┌─────────────────────────────────────────────┐
│  Single Machine (Your Laptop)               │
│  ├── 16 GB RAM                              │
│  ├── 1 TB data = CRASH / Takes hours        │
│  └── Limited processing power               │
└─────────────────────────────────────────────┘

Use 100 computers working together:
┌─────────────────────────────────────────────┐
│  Cluster of 100 Machines                    │
│  ├── Each handles 10 GB                     │
│  ├── 1 TB data = Minutes                    │
│  └── Parallel processing                    │
└─────────────────────────────────────────────┘
```

## What is Apache Spark?

```
Apache Spark = Distributed Data Processing Engine

Your Code (Python/SQL)
        ↓
   [Spark Engine]
        ↓
   Splits work across many computers
        ↓
   Combines results
        ↓
   Returns answer
```

## Databricks = Managed Platform for Apache Spark

```
┌────────────────────────────────────────────────────────────┐
│                      DATABRICKS                            │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Notebooks   │  │   Clusters   │  │     Jobs     │     │
│  │  (Write Code)│  │  (Computers) │  │  (Schedule)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Delta Lake  │  │  Unity       │  │   MLflow     │     │
│  │  (Storage)   │  │  Catalog     │  │   (ML Ops)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                            │
│                 [Apache Spark Engine]                      │
└────────────────────────────────────────────────────────────┘
```

## How Databricks Cluster Works

```
When you click "Create Cluster":

┌────────────────────────────────────────────────────────────┐
│                     YOUR CLUSTER                           │
│    ┌─────────────┐                                        │
│    │   DRIVER    │  ← Your code runs here first           │
│    │   (Brain)   │  ← Distributes work to workers         │
│    └──────┬──────┘                                        │
│           │                                                │
│     ┌─────┴─────┬─────────────┬─────────────┐            │
│     ↓           ↓             ↓             ↓            │
│ ┌────────┐ ┌────────┐   ┌────────┐   ┌────────┐         │
│ │Worker 1│ │Worker 2│   │Worker 3│   │Worker 4│         │
│ │ 16 GB  │ │ 16 GB  │   │ 16 GB  │   │ 16 GB  │         │
│ └────────┘ └────────┘   └────────┘   └────────┘         │
│                                                            │
│  Each worker processes a portion of your data              │
└────────────────────────────────────────────────────────────┘

Example: 40 GB file
├── Worker 1: Processes 10 GB
├── Worker 2: Processes 10 GB
├── Worker 3: Processes 10 GB
└── Worker 4: Processes 10 GB

Result: 4x faster than single machine
```

## Azure Databricks

```
Azure Databricks = Databricks running on Microsoft Azure Cloud

┌─────────────────────────────────────────────────────────────┐
│                    MICROSOFT AZURE                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                  AZURE DATABRICKS                      │ │
│  │    Your Notebooks + Clusters + Delta Lake              │ │
│  └───────────────────────────────────────────────────────┘ │
│                          ↓ ↑                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Azure Blob  │  │ Azure Data  │  │   Azure     │        │
│  │ Storage     │  │ Lake Gen2   │  │   Synapse   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Azure Data  │  │   Power BI  │  │  Azure SQL  │        │
│  │ Factory     │  │             │  │  Database   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└────────────────────────────────────────────────────────────┘
```

---

# Delta Lake

## The Problem: Regular Files Are Unreliable

```
CSV / Parquet Files:
├── ❌ Cannot UPDATE single record (must rewrite entire file)
├── ❌ Cannot DELETE single record (must rewrite entire file)
├── ❌ No versioning (cannot see yesterday's data)
├── ❌ No ACID transactions (can corrupt on failure)
├── ❌ No schema enforcement (bad data can enter)
└── ❌ No audit trail (who changed what?)
```

## Delta Lake = Reliable Data Storage

```
┌─────────────────────────────────────────────────────────┐
│                     DELTA LAKE                          │
├─────────────────────────────────────────────────────────┤
│  ✓ ACID Transactions (no corruption)                   │
│  ✓ UPDATE / DELETE / MERGE single records              │
│  ✓ Time Travel (see any past version)                  │
│  ✓ Schema Enforcement (reject bad data)                │
│  ✓ Audit History (track all changes)                   │
│  ✓ Scalable (handles petabytes)                        │
│                                                         │
│  Storage: Parquet files + Transaction Log (_delta_log) │
└─────────────────────────────────────────────────────────┘
```

## Delta Lake Structure

```
/data/customers/                    ← Delta Table Location
├── _delta_log/                     ← Transaction Log
│   ├── 00000000000000000000.json   ← Version 0
│   ├── 00000000000000000001.json   ← Version 1
│   └── ...
├── part-00000-xxx.parquet          ← Actual data files
├── part-00001-xxx.parquet
└── part-00002-xxx.parquet
```

## How to Build Delta Lake

### Step 1: Create Your First Delta Table

```python
# Sample data
data = [
    ("C001", "Rahul Sharma", "Mumbai", "Gold", 50000),
    ("C002", "Priya Singh", "Delhi", "Silver", 30000),
    ("C003", "Amit Patel", "Bangalore", "Gold", 75000),
    ("C004", "Sneha Reddy", "Chennai", "Bronze", 15000),
    ("C005", "Vikram Kumar", "Pune", "Silver", 25000)
]

columns = ["customer_id", "name", "city", "tier", "total_purchases"]
customers_df = spark.createDataFrame(data, columns)

# Write as Delta Table
customers_df.write \
    .format("delta") \
    .mode("overwrite") \
    .save("/delta/customers")
```

### Step 2: UPDATE Records

```python
from delta.tables import DeltaTable

delta_table = DeltaTable.forPath(spark, "/delta/customers")

# Update Rahul's city to Hyderabad
delta_table.update(
    condition = "customer_id = 'C001'",
    set = { "city": "'Hyderabad'" }
)
```

### Step 3: DELETE Records

```python
# Delete customer with Bronze tier
delta_table.delete("tier = 'Bronze'")
```

### Step 4: MERGE (Upsert)

```python
# New data - some existing customers (update), some new (insert)
new_data = [
    ("C001", "Rahul Sharma", "Mumbai", "Platinum", 100000),  # Existing - UPDATE
    ("C002", "Priya Singh", "Delhi", "Gold", 60000),         # Existing - UPDATE
    ("C006", "Neha Gupta", "Hyderabad", "Silver", 20000)     # New - INSERT
]

new_df = spark.createDataFrame(new_data, columns)

# MERGE operation
delta_table.alias("target").merge(
    new_df.alias("source"),
    "target.customer_id = source.customer_id"
).whenMatchedUpdateAll() \
 .whenNotMatchedInsertAll() \
 .execute()
```

### Step 5: Time Travel

```python
# See version history
history = delta_table.history()
display(history)

# Read specific version
df_version_0 = spark.read.format("delta") \
    .option("versionAsOf", 0) \
    .load("/delta/customers")

# Read data as of timestamp
df_yesterday = spark.read.format("delta") \
    .option("timestampAsOf", "2024-01-15") \
    .load("/delta/customers")
```

---

# Unity Catalog

## The Problem: Data Chaos

```
Without Unity Catalog:
├── No central view of all data
├── No access control (anyone can read anything)
├── No data lineage (where did this data come from?)
├── Duplicate data across workspaces
└── Compliance nightmare (GDPR, audits)
```

## Unity Catalog = Central Data Governance

```
┌─────────────────────────────────────────────────────────────┐
│                      UNITY CATALOG                          │
│                  (Single Source of Truth)                   │
├─────────────────────────────────────────────────────────────┤
│  METASTORE (Top Level)                                      │
│  └── CATALOG (e.g., production, development)               │
│      └── SCHEMA (e.g., sales, marketing)                   │
│          └── TABLE (e.g., customers, orders)               │
│                                                             │
│  Features:                                                  │
│  ✓ Centralized access control                              │
│  ✓ Data lineage tracking                                   │
│  ✓ Audit logs                                              │
│  ✓ Cross-workspace data sharing                            │
│  ✓ Fine-grained permissions (row/column level)             │
└─────────────────────────────────────────────────────────────┘
```

## Unity Catalog Hierarchy

```
METASTORE (company-wide)
│
├── CATALOG: production
│   ├── SCHEMA: sales
│   │   ├── TABLE: orders
│   │   ├── TABLE: customers
│   │   └── TABLE: products
│   └── SCHEMA: marketing
│       ├── TABLE: campaigns
│       └── TABLE: leads
│
├── CATALOG: development
│   └── SCHEMA: sandbox
│
└── CATALOG: analytics
    └── SCHEMA: reporting
```

## How to Set Up Unity Catalog

### Step 1: Create Metastore (Account Admin)

```
Account Console → Catalog → Create Metastore

Settings:
├── Name: company-metastore
├── Region: match your workspace region
├── Storage: s3://your-bucket/unity-catalog/
└── Click "Create"
```

### Step 2: Create Catalog and Schema

```sql
-- Create catalog
CREATE CATALOG IF NOT EXISTS production;
USE CATALOG production;

-- Create schema
CREATE SCHEMA IF NOT EXISTS production.sales;
USE SCHEMA production.sales;
```

### Step 3: Create Table

```sql
CREATE TABLE IF NOT EXISTS production.sales.customers (
    customer_id STRING,
    name STRING,
    city STRING,
    tier STRING,
    total_purchases DECIMAL(10,2)
);

INSERT INTO production.sales.customers VALUES
    ('C001', 'Rahul Sharma', 'Mumbai', 'Gold', 50000.00),
    ('C002', 'Priya Singh', 'Delhi', 'Silver', 30000.00);
```

### Step 4: Grant Permissions

```sql
-- Grant read access to data analysts
GRANT SELECT ON TABLE production.sales.customers
TO `data_analysts@company.com`;

-- Grant full access to data engineers
GRANT ALL PRIVILEGES ON SCHEMA production.sales
TO `data_engineers@company.com`;
```

---

# Zero-Copy Replication

## The Problem: Traditional Data Copying

```
Traditional Approach: Copy Data Everywhere

Source Database (1 TB)
        ├──→ Copy to Dev Environment (1 TB)     💰 Storage cost
        ├──→ Copy to Test Environment (1 TB)    💰 Storage cost
        ├──→ Copy to Analytics Team (1 TB)      💰 Storage cost
        └──→ Copy to Data Science (1 TB)        💰 Storage cost

Total Storage: 5 TB (5x cost!)
Time to copy: Hours per copy
```

## Zero-Copy Cloning Solution

```
Zero-Copy Approach: Share Metadata, Not Data

Source Table (1 TB actual data)
        │
        │  (Only metadata copied - instant!)
        │
        ├──→ Dev Clone (0 bytes additional)     ✓ FREE
        ├──→ Test Clone (0 bytes additional)    ✓ FREE
        ├──→ Analytics Clone (0 bytes additional) ✓ FREE
        └──→ Data Science Clone (0 bytes additional) ✓ FREE

Total Storage: Still ~1 TB
Time to clone: SECONDS (not hours)
```

## How It Works

```
ORIGINAL TABLE                    CLONED TABLE
┌─────────────────┐              ┌─────────────────┐
│ Metadata        │              │ Metadata        │
│ - Schema        │              │ - Schema        │
│ - File pointers │──────────────│ - File pointers │
└────────┬────────┘              └────────┬────────┘
         │                                │
         └───────────────┬────────────────┘
                         ↓
              ┌─────────────────────┐
              │   ACTUAL DATA       │
              │   Only ONE copy!    │
              └─────────────────────┘

Both tables POINT to same physical files
No data is duplicated!
```

## Delta Lake - Zero-Copy Clone Example

```sql
-- Shallow Clone (zero-copy, references original files) - INSTANT!
CREATE TABLE development.sales.orders_dev
SHALLOW CLONE production.sales.orders;

-- Deep Clone (actual copy - use when you need independent copy)
CREATE TABLE backup.sales.orders_backup
DEEP CLONE production.sales.orders;

-- Clone with time travel
CREATE TABLE dev.customers_snapshot
SHALLOW CLONE prod.customers
VERSION AS OF 10;
```

## Copy-On-Write Behavior

```
BEFORE MODIFICATION:
Original & Clone → Point to same files

AFTER MODIFYING CLONE:
Original → Original files (1 TB)
Clone    → Original files + New changes (10 MB)

Storage: 1 TB + 10 MB (not 2 TB!)
Only modified data creates new storage
```

## Data Sharing (Cross-Organization)

```sql
-- PROVIDER SIDE
CREATE SHARE sales_share;
GRANT USAGE ON DATABASE production TO SHARE sales_share;
GRANT SELECT ON TABLE production.sales.orders TO SHARE sales_share;
ALTER SHARE sales_share ADD ACCOUNTS = partner_account_id;

-- CONSUMER SIDE
CREATE DATABASE partner_sales FROM SHARE provider_account.sales_share;
SELECT * FROM partner_sales.sales.orders;  -- Always live data!
```

---

# Why Databricks/Snowflake vs iPaaS?

## What iPaaS Tools (MuleSoft, Boomi) Can Do

```
Good For:
├── Moving data A → B (simple transfers)
├── API integrations
├── Small to medium data (MBs to few GBs)
├── Real-time single record processing
└── Simple transformations
```

## When iPaaS Fails

### Example: 5 Million Transactions/Day

```
With iPaaS (MuleSoft/Boomi):
├── Processes 1 record at a time
├── 5 million records × 0.1 second = 138 hours
├── Memory limits hit
├── Cost: $$$$ (charged per API call)
└── Result: IMPOSSIBLE

With Databricks:
├── Distributes across 10 workers
├── Parallel processing: 15-30 minutes
├── Complex aggregations possible
├── Cost: $ (pay for compute time)
└── Result: Done by 5:30 AM
```

## Comparison Table

| Aspect | iPaaS (MuleSoft, Boomi) | Databricks/Snowflake |
|--------|------------------------|----------------------|
| **Best For** | System integration, APIs | Data analytics, big data |
| **Data Volume** | MBs to small GBs | GBs to PBs |
| **Processing** | Record by record | Millions parallel |
| **Analytics** | Basic aggregations | Advanced analytics, ML |
| **ML/AI** | Not supported | Built-in support |
| **Pricing** | Per API call/record | Per compute hour |

## They Work Together!

```
SOURCE SYSTEMS          INTEGRATION         DATA PLATFORM
┌──────────┐           ┌──────────┐        ┌───────────────┐
│   SAP    │──────────→│          │        │               │
└──────────┘           │  iPaaS   │        │  DATABRICKS   │
┌──────────┐           │  (Move   │───────→│  or           │
│Salesforce│──────────→│   Data)  │        │  SNOWFLAKE    │
└──────────┘           └──────────┘        │               │
                                           │  (Process &   │
┌──────────┐                               │   Analyze)    │
│ IoT/Logs │──────────────────────────────→│               │
└──────────┘     (Direct - too much        └───────────────┘
                 volume for iPaaS)
```

---

# Free Resources

| Skill | Resource |
|-------|----------|
| Python | [Kaggle Python](https://www.kaggle.com/learn/python), HackerRank |
| SQL | [DataLemur](https://datalemur.com/), LeetCode SQL 50 |
| ADF | [Microsoft Learn ADF Path](https://learn.microsoft.com/en-us/training/paths/data-integration-scale-azure-data-factory/) |
| Snowflake | [Snowflake University](https://learn.snowflake.com/) |
| PySpark | [Databricks Community Edition](https://community.cloud.databricks.com/) |

---

# Certifications to Target

1. **Azure DP-203**: Azure Data Engineer Associate
2. **Snowflake SnowPro Core**: Validates Snowflake skills
3. **Databricks Certified Data Engineer Associate**

---

*Last Updated: December 2024*
