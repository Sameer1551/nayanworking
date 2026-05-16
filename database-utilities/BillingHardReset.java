import java.sql.*;
public class BillingHardReset {
  public static void main(String[] args) throws Exception {
    String url = "jdbc:mysql://localhost:3306/nayan-db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    try (Connection conn = DriverManager.getConnection(url, "root", "root")) {
      try (Statement st = conn.createStatement()) {
        st.execute("SET FOREIGN_KEY_CHECKS=0");
        st.execute("DROP TABLE IF EXISTS billing_products");
        st.execute("DROP TABLE IF EXISTS billing_records");

        st.execute("CREATE TABLE billing_records ("
          + "id bigint NOT NULL AUTO_INCREMENT,"
          + "additional_notes text,"
          + "advance_paid decimal(38,2) DEFAULT NULL,"
          + "amount decimal(38,2) DEFAULT NULL,"
          + "authorized_signatory varchar(255) DEFAULT NULL,"
          + "axis_left varchar(255) DEFAULT NULL,"
          + "axis_right varchar(255) DEFAULT NULL,"
          + "bill_date date DEFAULT NULL,"
          + "bill_number varchar(255) DEFAULT NULL,"
          + "branch_code varchar(255) DEFAULT NULL,"
          + "branch_name varchar(255) DEFAULT NULL,"
          + "created_at datetime(6) DEFAULT NULL,"
          + "customer_address text,"
          + "customer_contact varchar(255) DEFAULT NULL,"
          + "customer_email varchar(255) DEFAULT NULL,"
          + "customer_name varchar(255) DEFAULT NULL,"
          + "cyl_left varchar(255) DEFAULT NULL,"
          + "cyl_right varchar(255) DEFAULT NULL,"
          + "discount decimal(38,2) DEFAULT NULL,"
          + "final_payable decimal(38,2) DEFAULT NULL,"
          + "lens_power_left varchar(255) DEFAULT NULL,"
          + "lens_power_right varchar(255) DEFAULT NULL,"
          + "payment_method varchar(255) DEFAULT NULL,"
          + "payment_status varchar(255) DEFAULT NULL,"
          + "pd varchar(255) DEFAULT NULL,"
          + "pd_left varchar(255) DEFAULT NULL,"
          + "pd_right varchar(255) DEFAULT NULL,"
          + "prescription_delivery_date date DEFAULT NULL,"
          + "return_policy text,"
          + "sph_left varchar(255) DEFAULT NULL,"
          + "sph_right varchar(255) DEFAULT NULL,"
          + "subtotal decimal(38,2) DEFAULT NULL,"
          + "total_gst decimal(38,2) DEFAULT NULL,"
          + "transaction_ref varchar(255) DEFAULT NULL,"
          + "updated_at datetime(6) DEFAULT NULL,"
          + "warranty_details text,"
          + "customer_id bigint DEFAULT NULL,"
          + "PRIMARY KEY (id),"
          + "UNIQUE KEY UK_i7850mf48lgrsxnrqan8krkcs (bill_number),"
          + "KEY FKiefuhplbsbj73v96td18tbvv6 (customer_id),"
          + "CONSTRAINT FKiefuhplbsbj73v96td18tbvv6 FOREIGN KEY (customer_id) REFERENCES customers (id)"
          + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci");

        st.execute("CREATE TABLE billing_products ("
          + "id bigint NOT NULL AUTO_INCREMENT,"
          + "category varchar(255) DEFAULT NULL,"
          + "description text,"
          + "gst_amount decimal(38,2) DEFAULT NULL,"
          + "gst_percentage decimal(38,2) DEFAULT NULL,"
          + "hsn_code varchar(255) DEFAULT NULL,"
          + "price_per_unit decimal(38,2) DEFAULT NULL,"
          + "product_code varchar(255) DEFAULT NULL,"
          + "product_name varchar(255) DEFAULT NULL,"
          + "quantity int DEFAULT NULL,"
          + "total decimal(38,2) DEFAULT NULL,"
          + "billing_record_id bigint DEFAULT NULL,"
          + "PRIMARY KEY (id),"
          + "KEY FK6sjb3h3k61cuad4lf4rp7u3jf (billing_record_id),"
          + "CONSTRAINT FK6sjb3h3k61cuad4lf4rp7u3jf FOREIGN KEY (billing_record_id) REFERENCES billing_records (id)"
          + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci");

        st.execute("SET FOREIGN_KEY_CHECKS=1");

        try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM billing_records")) {
          rs.next();
          System.out.println("billing_records rows=" + rs.getInt(1));
        }
        try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM billing_products")) {
          rs.next();
          System.out.println("billing_products rows=" + rs.getInt(1));
        }
        try (ResultSet rs = st.executeQuery("SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA='nayan-db' AND TABLE_NAME='billing_records'")) {
          if (rs.next()) {
            System.out.println("billing_records AUTO_INCREMENT=" + rs.getLong(1));
          }
        }
      }
    }
  }
}
