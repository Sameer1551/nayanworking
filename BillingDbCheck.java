import java.sql.*;
public class BillingDbCheck {
  public static void main(String[] args) throws Exception {
    String url = "jdbc:mysql://localhost:3306/nayan-db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    try (Connection conn = DriverManager.getConnection(url, "root", "root")) {
      try (Statement st = conn.createStatement()) {
        for (String table : new String[]{"billing_products", "billing_records"}) {
          try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM " + table)) {
            rs.next();
            System.out.println(table + " rows=" + rs.getInt(1));
          }
        }
        try (ResultSet rs = st.executeQuery("SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA='nayan-db' AND TABLE_NAME='billing_records'")) {
          if (rs.next()) {
            System.out.println("billing_records AUTO_INCREMENT=" + rs.getLong(1));
          }
        }
        try (ResultSet rs = st.executeQuery("SELECT id, bill_number, branch_code FROM billing_records ORDER BY id")) {
