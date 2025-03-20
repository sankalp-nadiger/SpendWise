import { Document, Packer, Paragraph, Table, TableRow, TableCell, BorderStyle, AlignmentType, HeadingLevel } from "docx";
import PDFDocument from "pdfkit";
import Expense from "../models/expense.model.js";
import OrganizationUser from "../models/orgUser.model.js";
import transporter from "../../app.js"; // adjust path to your mailer configuration

// Helper function to remove empty fields from an object
function filterNonEmptyFields(expense) {
  // If expense is a Mongoose document, convert to plain object first
  const obj = expense.toObject ? expense.toObject() : expense;
  const result = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== null && value !== undefined && value !== "") {
      result[key] = value;
    }
  });
  return result;
}

// Helper function to generate a unique filename
function generateUniqueFilename(fileType) {
  const timestamp = Date.now(); // returns the milliseconds since epoch
  const randomString = Math.random().toString(36).substring(2, 8);
  return `expense-report-${timestamp}-${randomString}.${fileType}`;
}



// Helper: Format field names for display (capitalize first letter, add spaces before uppercase letters)
const formatFieldName = (field) => {
  if (field === 'id') return 'ID';
  return field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
};

export const downloadExpenseReport = async (req, res) => {
  try {
    const { fileType } = req.params;
    const { filters } = req.body;
    const userId = req.user._id;

    // Generate unique filename for this report
    const uniqueFilename = generateUniqueFilename(fileType);
    console.log("Generated Filename:", uniqueFilename);

    // Determine if the user is an organization user
    const orgUser = await OrganizationUser.findOne({ user: userId });
    let query = {};
    if (orgUser) {
      query.organization = orgUser.organization;
    } else {
      query.user = userId;
    }

    // Apply additional filters if provided
    if (filters) {
      if (filters.searchTerm) {
        query.description = { $regex: filters.searchTerm, $options: 'i' };
      }
      if (filters.category && filters.category !== 'all') {
        query.category = filters.category;
      }
      if (filters.department && filters.department !== 'all') {
        query.department = filters.department;
      }
    }

    // Fetch expenses (populate createdBy so we have the user's name) and sort them by date in descending order
    let expenses = await Expense.find(query)
      .populate("createdBy", "name")
      .sort({ date: -1 });

    // Filter out empty fields from each expense record
    expenses = expenses.map(expense => filterNonEmptyFields(expense));

    // Get all possible field names from the expenses (exclude internal fields)
    let allFields = new Set();
    expenses.forEach(expense => {
      Object.keys(expense).forEach(key => {
        if (!['_id', '__v', 'createdAt', 'updatedAt', 'user', 'organization'].includes(key)) {
          allFields.add(key);
        }
      });
    });
    
    // Convert to array and ensure important fields come first
    const priorityFields = ['date', 'description', 'category', 'amount'];
    let fieldsArray = Array.from(allFields);
    fieldsArray.sort((a, b) => {
      const indexA = priorityFields.indexOf(a);
      const indexB = priorityFields.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    if (fileType === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument();

      // Set response headers with unique filename
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${uniqueFilename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
res.setHeader('Pragma', 'no-cache');
res.setHeader('Expires', '0');

      // Pipe the PDF to the response
      doc.pipe(res);

      // Add title and generation info
      doc.fontSize(20).text('Expense Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      // Define table parameters – adjust column width based on number of columns
      const pageWidth = 500;
      const tableLeft = 50;
      const colWidth = Math.min(120, Math.floor(pageWidth / fieldsArray.length));
      const cellHeight = 20;
      const padding = 5;

      // Table headers
      const headers = fieldsArray.map(field => formatFieldName(field));
      doc.fontSize(10);
      
      headers.forEach((header, index) => {
        const cellX = tableLeft + index * colWidth;
        // Draw border for header cell
        doc.rect(cellX, 150, colWidth, cellHeight).stroke();
        // Add header text inside cell with padding
        doc.text(header, cellX + padding, 150 + padding, {
          width: colWidth - padding * 2,
          height: cellHeight,
        });
      });

      // Table rows
      let yPos = 150 + cellHeight;
      doc.fontSize(9);
      
      expenses.forEach(expense => {
        // Add a new page if necessary
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        fieldsArray.forEach((field, index) => {
          const cellX = tableLeft + index * colWidth;
          let value = "";
          if (expense[field] !== undefined) {
            if (field === 'date') {
              value = new Date(expense[field]).toLocaleDateString();
            } else if (field === 'amount') {
              // Use the proper currency symbol; ensure conversion to number
              value = `₹${Number(expense[field]).toFixed(2)}`;
            } else if (field === 'createdBy' && expense.createdBy && expense.createdBy.name) {
              value = expense.createdBy.name;
            } else {
              value = String(expense[field]);
            }
          }
          
          // Draw border for data cell
          doc.rect(cellX, yPos, colWidth, cellHeight).stroke();
          // Add text inside the cell with padding
          doc.text(value, cellX + padding, yPos + padding, {
            width: colWidth - padding * 2,
            height: cellHeight,
          });
        });

        yPos += cellHeight;
      });

      // End the document
      doc.end();

    } else if (fileType === 'docx') {
      // Generate Word document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "Expense Report",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                text: `Generated on: ${new Date().toLocaleString()}`,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ text: "" }),
              // Create table with dynamic columns and borders
              new Table({
                rows: [
                  // Header row with dynamic columns
                  new TableRow({
                    children: fieldsArray.map(field => 
                      new TableCell({
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                        children: [new Paragraph({ text: formatFieldName(field) })],
                      })
                    ),
                  }),
                  // Data rows with dynamic columns
                  ...expenses.map(expense =>
                    new TableRow({
                      children: fieldsArray.map(field => {
                        let value = "";
                        if (expense[field] !== undefined) {
                          if (field === 'date') {
                            value = new Date(expense[field]).toLocaleDateString();
                          } else if (field === 'amount') {
                            value = `₹${Number(expense[field]).toFixed(2)}`;
                          } else if (field === 'createdBy' && expense.createdBy && expense.createdBy.name) {
                            value = expense.createdBy.name;
                          } else {
                            value = String(expense[field]);
                          }
                        }
                        
                        return new TableCell({
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                          children: [new Paragraph({ text: value })],
                        });
                      }),
                    })
                  ),
                ],
              }),
            ],
          },
        ],
      });

      // Generate the document buffer
      const buffer = await Packer.toBuffer(doc);

      // Set response headers for docx with unique filename
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename=${uniqueFilename}`);

      // Send the document buffer
      res.send(buffer);
    } else {
      return res.status(400).json({ message: "Invalid file type" });
    }

  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
};

// Email report endpoint
export const EmailSender = async (req, res) => {
  const { email, filters } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const uniqueFilename = generateUniqueFilename('pdf');
    
    // Determine expenses for the logged in user
    const userId = req.user._id; 
    const orgUser = await OrganizationUser.findOne({ user: userId });
    let query = {};
    if (orgUser) {
      query.organization = orgUser.organization;
    } else {
      query.user = userId;
    }

    if (filters) {
      if (filters.searchTerm) {
        query.description = { $regex: filters.searchTerm, $options: 'i' };
      }
      if (filters.category && filters.category !== 'all') {
        query.category = filters.category;
      }
      if (filters.department && filters.department !== 'all') {
        query.department = filters.department;
      }
    }
    
    let expenses = await Expense.find(query)
      .populate("createdBy", "name")
      .sort({ date: -1 });
    expenses = expenses.map(expense => filterNonEmptyFields(expense));

    // Get all possible field names for the dynamic table
    let allFields = new Set();
    expenses.forEach(expense => {
      Object.keys(expense).forEach(key => {
        if (!['_id', '__v'].includes(key)) {
          allFields.add(key);
        }
      });
    });
    
    const priorityFields = ['date', 'description', 'category', 'amount'];
    let fieldsArray = Array.from(allFields);
    fieldsArray.sort((a, b) => {
      const indexA = priorityFields.indexOf(a);
      const indexB = priorityFields.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    // Generate PDF buffer with the dynamic fields
    const pdfBuffer = await generatePDFBuffer(expenses, fieldsArray);

    // Set up email with attachment using unique filename
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "SpendWise Expense Report",
      text: `Please find attached your expense report generated on ${new Date().toLocaleString()}.`,
      attachments: [
        {
          filename: uniqueFilename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Expense report sent successfully" });
  } catch (error) {
    console.error("Error sending expense report:", error);
    res.status(500).json({ message: "Failed to send expense report" });
  }
};

// Helper function to generate PDF buffer (for email attachments)
async function generatePDFBuffer(expenses, fieldsArray) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];
      
      doc.on('data', buffer => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      
      // Title and generation date
      doc.fontSize(20).text('Expense Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);
      
      // Table configuration – adjust column width based on number of columns
      const pageWidth = 500;
      const tableLeft = 50;
      const colWidth = Math.min(120, Math.floor(pageWidth / fieldsArray.length));
      const cellHeight = 20;
      const padding = 5;
      
      // Table headers with dynamic fields
      const headers = fieldsArray.map(field => formatFieldName(field));
      doc.fontSize(10);
      
      headers.forEach((header, index) => {
        const cellX = tableLeft + index * colWidth;
        doc.rect(cellX, 150, colWidth, cellHeight).stroke();
        doc.text(header, cellX + padding, 150 + padding, {
          width: colWidth - padding * 2,
          height: cellHeight
        });
      });
      
      // Starting y-position for data rows
      let yPos = 150 + cellHeight;
      doc.fontSize(9);
      
      expenses.forEach(expense => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
        
        fieldsArray.forEach((field, index) => {
          const cellX = tableLeft + index * colWidth;
          let value = "";
          
          if (expense[field] !== undefined) {
            if (field === 'date') {
              value = new Date(expense[field]).toLocaleDateString();
            } else if (field === 'amount') {
              value = `₹${Number(expense[field]).toFixed(2)}`;
            } else if (field === 'createdBy' && expense.createdBy && expense.createdBy.name) {
              value = expense.createdBy.name;
            } else {
              value = String(expense[field]);
            }
          }
          
          doc.rect(cellX, yPos, colWidth, cellHeight).stroke();
          doc.text(value, cellX + padding, yPos + padding, {
            width: colWidth - padding * 2,
            height: cellHeight
          });
        });
        
        yPos += cellHeight;
      });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
