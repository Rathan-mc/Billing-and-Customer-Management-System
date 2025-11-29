class BillingManager {
    constructor() {
        this.records = JSON.parse(localStorage.getItem('billingRecords')) || [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderRecords();
        this.updateSummary();
        this.setTodayDate();
    }

    bindEvents() {
        document.getElementById('billingForm').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('statusFilter').addEventListener('change', () => this.renderRecords());
        document.getElementById('searchInput').addEventListener('input', () => this.renderRecords());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('printType').addEventListener('change', (e) => this.togglePrintOptions(e.target.value));
    }

    setTodayDate() {
        document.getElementById('date').valueAsDate = new Date();
    }

    togglePrintOptions(printType) {
        const printSidesGroup = document.getElementById('printSidesGroup');
        const colorsRow = document.getElementById('colorsRow');
        
        if (printType === 'print') {
            printSidesGroup.style.display = 'flex';
            colorsRow.style.display = 'flex';
            document.getElementById('printSides').required = true;
            document.getElementById('colors').required = true;
        } else {
            printSidesGroup.style.display = 'none';
            colorsRow.style.display = 'none';
            document.getElementById('printSides').required = false;
            document.getElementById('colors').required = false;
            document.getElementById('printSides').value = '';
            document.getElementById('colors').value = '';
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            id: Date.now(),
            date: document.getElementById('date').value,
            customerName: document.getElementById('customerName').value,
            quantity: parseFloat(document.getElementById('quantity').value),
            coverSize: document.getElementById('coverSize').value,
            amount: parseFloat(document.getElementById('amount').value),
            status: document.getElementById('status').value,
            manufacturer: document.getElementById('manufacturer').value,
            paymentMode: document.getElementById('paymentMode').value,
            printType: document.getElementById('printType').value,
            printSides: document.getElementById('printSides').value || '',
            colors: document.getElementById('colors').value || ''
        };

        this.records.push(formData);
        this.saveRecords();
        this.renderRecords();
        this.updateSummary();
        this.resetForm();
    }

    saveRecords() {
        localStorage.setItem('billingRecords', JSON.stringify(this.records));
    }

    renderRecords() {
        const filter = document.getElementById('statusFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const tbody = document.getElementById('recordsBody');
        
        let filteredRecords = this.records;
        
        if (filter !== 'all') {
            filteredRecords = filteredRecords.filter(record => record.status === filter);
        }
        
        if (searchTerm) {
            filteredRecords = filteredRecords.filter(record => 
                record.customerName.toLowerCase().includes(searchTerm) ||
                record.coverSize.toLowerCase().includes(searchTerm) ||
                record.manufacturer.toLowerCase().includes(searchTerm) ||
                record.paymentMode.toLowerCase().includes(searchTerm) ||
                record.printType.toLowerCase().includes(searchTerm) ||
                record.status.toLowerCase().includes(searchTerm) ||
                record.date.includes(searchTerm) ||
                record.amount.toString().includes(searchTerm)
            );
        }

        if (filteredRecords.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="empty-state">
                        <h3>No records found</h3>
                        <p>Add your first billing record to get started</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredRecords
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(record => `
                <tr>
                    <td>${this.formatDate(record.date)}</td>
                    <td>${record.customerName}</td>
                    <td>${record.quantity}</td>
                    <td>${record.coverSize}</td>
                    <td>₹${record.amount.toFixed(2)}</td>
                    <td><span class="status-badge status-${record.status}">${record.status}</span></td>
                    <td>${this.capitalize(record.manufacturer)}</td>
                    <td>${this.capitalize(record.paymentMode)}</td>
                    <td>${this.capitalize(record.printType)}</td>
                    <td>${this.getPrintDetails(record)}</td>
                    <td><button class="btn-delete" onclick="billingManager.deleteRecord(${record.id})">Delete</button></td>
                </tr>
            `).join('');
    }

    updateSummary() {
        const totalPaid = this.records
            .filter(record => record.status === 'paid')
            .reduce((sum, record) => sum + record.amount, 0);

        const totalDue = this.records
            .filter(record => record.status === 'due')
            .reduce((sum, record) => sum + record.amount, 0);

        document.getElementById('totalPaid').textContent = `₹${totalPaid.toFixed(2)}`;
        document.getElementById('totalDue').textContent = `₹${totalDue.toFixed(2)}`;
    }

    deleteRecord(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            this.records = this.records.filter(record => record.id !== id);
            this.saveRecords();
            this.renderRecords();
            this.updateSummary();
        }
    }

    resetForm() {
        document.getElementById('billingForm').reset();
        this.setTodayDate();
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN');
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getPrintDetails(record) {
        if (record.printType === 'plain') {
            return '-';
        }
        const sides = record.printSides ? this.capitalize(record.printSides) : '';
        const colors = record.colors ? this.capitalize(record.colors) : '';
        return [sides, colors].filter(Boolean).join(', ') || '-';
    }

    exportData() {
        if (this.records.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = ['Date', 'Customer Name', 'Quantity (kg)', 'Cover Size', 'Amount (₹)', 'Status', 'Manufacturer', 'Payment Mode', 'Print Type', 'Print Sides', 'Colors'];
        const csvContent = [
            headers.join(','),
            ...this.records.map(record => [
                record.date,
                `"${record.customerName}"`,
                record.quantity,
                record.coverSize,
                record.amount,
                record.status,
                record.manufacturer,
                record.paymentMode,
                record.printType,
                record.printSides || '',
                record.colors || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing-records-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize the application
const billingManager = new BillingManager();