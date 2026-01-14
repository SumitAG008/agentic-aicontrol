import SFTPClient from 'ssh2-sftp-client';
import * as XLSX from 'xlsx';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CompensationWorksheet } from './sf-api-client';

export interface SFTPConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  remotePath: string;
}

export interface FileUploadResult {
  success: boolean;
  fileName: string;
  remotePath: string;
  timestamp: Date;
  recordCount: number;
  error?: string;
}

export interface WorksheetUploadOptions {
  fileName?: string;
  validateBeforeUpload?: boolean;
  backupExisting?: boolean;
  format?: 'xlsx' | 'csv' | 'xml';
}

/**
 * SFTP Service for SuccessFactors File-based Upsert
 * Handles file uploads for compensation worksheet updates
 */
export class SuccessFactorsSFTPService {
  private config: SFTPConfig;
  private client: SFTPClient | null = null;
  private localTempDir: string;

  constructor(config: SFTPConfig, tempDir: string = '/tmp/sf-uploads') {
    this.config = config;
    this.localTempDir = tempDir;
  }

  /**
   * Connect to SFTP server
   */
  async connect(): Promise<void> {
    if (this.client) {
      console.log('[SFTP] Already connected');
      return;
    }

    this.client = new SFTPClient();

    try {
      await this.client.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        privateKey: this.config.privateKey,
        passphrase: this.config.passphrase,
      });

      console.log(`[SFTP] Connected to ${this.config.host}`);
    } catch (error) {
      throw new Error(`Failed to connect to SFTP: ${error}`);
    }
  }

  /**
   * Disconnect from SFTP server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
      console.log('[SFTP] Disconnected');
    }
  }

  /**
   * Upload compensation worksheets for upsert
   */
  async uploadCompensationWorksheets(
    worksheets: CompensationWorksheet[],
    options: WorksheetUploadOptions = {}
  ): Promise<FileUploadResult> {
    const {
      fileName = `compensation_upsert_${Date.now()}.xlsx`,
      validateBeforeUpload = true,
      backupExisting = true,
      format = 'xlsx',
    } = options;

    try {
      await this.connect();

      // Ensure local temp directory exists
      await fs.mkdir(this.localTempDir, { recursive: true });

      // Validate data if requested
      if (validateBeforeUpload) {
        const validationErrors = this.validateWorksheets(worksheets);
        if (validationErrors.length > 0) {
          throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }
      }

      // Generate file based on format
      let localFilePath: string;
      if (format === 'xlsx') {
        localFilePath = await this.generateExcelFile(worksheets, fileName);
      } else if (format === 'csv') {
        localFilePath = await this.generateCSVFile(worksheets, fileName);
      } else if (format === 'xml') {
        localFilePath = await this.generateXMLFile(worksheets, fileName);
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }

      // Backup existing file if requested
      if (backupExisting) {
        await this.backupExistingFile(fileName);
      }

      // Upload file to SFTP
      const remotePath = path.posix.join(this.config.remotePath, fileName);
      await this.client!.put(localFilePath, remotePath);

      console.log(`[SFTP] Uploaded ${fileName} to ${remotePath}`);

      // Clean up local file
      await fs.unlink(localFilePath);

      return {
        success: true,
        fileName,
        remotePath,
        timestamp: new Date(),
        recordCount: worksheets.length,
      };
    } catch (error) {
      console.error('[SFTP] Upload failed:', error);
      return {
        success: false,
        fileName,
        remotePath: '',
        timestamp: new Date(),
        recordCount: worksheets.length,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Generate Excel file from worksheets
   */
  private async generateExcelFile(
    worksheets: CompensationWorksheet[],
    fileName: string
  ): Promise<string> {
    const workbook = XLSX.utils.book_new();

    // Transform data to rows
    const rows = worksheets.map((ws) => ({
      'User ID': ws.userId,
      'Employee ID': ws.employeeId,
      'First Name': ws.firstName,
      'Last Name': ws.lastName,
      'Current Salary': ws.currentSalary,
      'Proposed Salary': ws.proposedSalary,
      'Salary Increase': ws.salaryIncrease,
      'Increase %': ws.increasePercentage,
      'Effective Date': ws.effectiveDate,
      'Currency': ws.currency,
      'Department': ws.department,
      'Job Title': ws.jobTitle,
      ...ws.customFields,
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Compensation Data');

    // Write to file
    const localFilePath = path.join(this.localTempDir, fileName);
    XLSX.writeFile(workbook, localFilePath);

    return localFilePath;
  }

  /**
   * Generate CSV file from worksheets
   */
  private async generateCSVFile(
    worksheets: CompensationWorksheet[],
    fileName: string
  ): Promise<string> {
    const headers = [
      'User ID',
      'Employee ID',
      'First Name',
      'Last Name',
      'Current Salary',
      'Proposed Salary',
      'Salary Increase',
      'Increase %',
      'Effective Date',
      'Currency',
      'Department',
      'Job Title',
    ];

    const rows = worksheets.map((ws) => [
      ws.userId,
      ws.employeeId,
      ws.firstName,
      ws.lastName,
      ws.currentSalary,
      ws.proposedSalary,
      ws.salaryIncrease,
      ws.increasePercentage,
      ws.effectiveDate,
      ws.currency,
      ws.department,
      ws.jobTitle,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const localFilePath = path.join(this.localTempDir, fileName.replace('.xlsx', '.csv'));
    await fs.writeFile(localFilePath, csvContent, 'utf-8');

    return localFilePath;
  }

  /**
   * Generate XML file for SuccessFactors import
   */
  private async generateXMLFile(
    worksheets: CompensationWorksheet[],
    fileName: string
  ): Promise<string> {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<CompensationData>
  ${worksheets
    .map(
      (ws) => `
  <Employee>
    <userId>${ws.userId}</userId>
    <employeeId>${ws.employeeId}</employeeId>
    <firstName>${ws.firstName}</firstName>
    <lastName>${ws.lastName}</lastName>
    <currentSalary>${ws.currentSalary}</currentSalary>
    <proposedSalary>${ws.proposedSalary}</proposedSalary>
    <salaryIncrease>${ws.salaryIncrease}</salaryIncrease>
    <increasePercentage>${ws.increasePercentage}</increasePercentage>
    <effectiveDate>${ws.effectiveDate}</effectiveDate>
    <currency>${ws.currency}</currency>
    <department>${ws.department}</department>
    <jobTitle>${ws.jobTitle}</jobTitle>
  </Employee>`
    )
    .join('')}
</CompensationData>`;

    const localFilePath = path.join(this.localTempDir, fileName.replace('.xlsx', '.xml'));
    await fs.writeFile(localFilePath, xmlContent, 'utf-8');

    return localFilePath;
  }

  /**
   * Validate worksheets before upload
   */
  private validateWorksheets(worksheets: CompensationWorksheet[]): string[] {
    const errors: string[] = [];

    worksheets.forEach((ws, index) => {
      if (!ws.userId) errors.push(`Row ${index + 1}: Missing userId`);
      if (!ws.employeeId) errors.push(`Row ${index + 1}: Missing employeeId`);
      if (ws.proposedSalary < 0) errors.push(`Row ${index + 1}: Invalid proposed salary`);
      if (ws.currentSalary < 0) errors.push(`Row ${index + 1}: Invalid current salary`);
      if (!ws.effectiveDate) errors.push(`Row ${index + 1}: Missing effective date`);
    });

    return errors;
  }

  /**
   * Backup existing file on SFTP server
   */
  private async backupExistingFile(fileName: string): Promise<void> {
    try {
      const remotePath = path.posix.join(this.config.remotePath, fileName);
      const backupPath = path.posix.join(
        this.config.remotePath,
        'backups',
        `${fileName}.${Date.now()}.bak`
      );

      const exists = await this.client!.exists(remotePath);
      if (exists) {
        await this.client!.mkdir(path.posix.join(this.config.remotePath, 'backups'), true);
        await this.client!.rename(remotePath, backupPath);
        console.log(`[SFTP] Backed up ${fileName} to ${backupPath}`);
      }
    } catch (error) {
      console.warn(`[SFTP] Failed to backup file: ${error}`);
    }
  }

  /**
   * Download file from SFTP
   */
  async downloadFile(remoteFileName: string, localPath?: string): Promise<string> {
    try {
      await this.connect();

      const remotePath = path.posix.join(this.config.remotePath, remoteFileName);
      const localFilePath = localPath || path.join(this.localTempDir, remoteFileName);

      await fs.mkdir(path.dirname(localFilePath), { recursive: true });
      await this.client!.get(remotePath, localFilePath);

      console.log(`[SFTP] Downloaded ${remoteFileName} to ${localFilePath}`);
      return localFilePath;
    } catch (error) {
      throw new Error(`Failed to download file: ${error}`);
    } finally {
      await this.disconnect();
    }
  }

  /**
   * List files in remote directory
   */
  async listFiles(directory?: string): Promise<any[]> {
    try {
      await this.connect();
      const remotePath = directory || this.config.remotePath;
      const files = await this.client!.list(remotePath);
      return files;
    } catch (error) {
      throw new Error(`Failed to list files: ${error}`);
    } finally {
      await this.disconnect();
    }
  }
}
